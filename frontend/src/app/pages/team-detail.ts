import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';
import { TeamsApi, TeamDto, TeamPlayerDto } from '../services/teams.api';
import { PlayersApi } from '../services/players.api';

@Component({
  selector: 'app-team-detail',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    DialogModule,
    AppShell,
    PageHeader,
  ],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css',
  providers: [MessageService],
})
export class TeamDetail {
  teamId: number;

  loading = false;
  saving = false;

  team: TeamDto | null = null;
  players: TeamPlayerDto[] = [];

  // Add player dialog
  addDialogOpen = false;
  playerSearch = '';
  searchLoading = false;
  searchResults: Array<{ id: number; name: string; email?: string | null; position?: string | null; category?: string | null }> = [];
  selectedSearchPlayerIds: number[] = [];

  constructor(
    route: ActivatedRoute,
    private readonly router: Router,
    private readonly teamsApi: TeamsApi,
    private readonly playersApi: PlayersApi,
    private readonly toast: MessageService,
  ) {
    const rawId = route.snapshot.paramMap.get('id');
    this.teamId = Number(rawId);
    this.load();
  }

  private load(): void {
    if (!Number.isFinite(this.teamId) || this.teamId <= 0) {
      this.toast.add({ severity: 'error', summary: 'Error', detail: 'Id de equipo inválido.' });
      this.router.navigateByUrl('/teams');
      return;
    }

    this.loading = true;
    this.teamsApi.get(this.teamId).subscribe({
      next: (t: TeamDto) => {
        this.team = t;
        this.loadPlayers();
      },
      error: (e: unknown) => {
        this.loading = false;
        const msg = e instanceof Error ? e.message : 'No se pudo cargar el equipo.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  private loadPlayers(): void {
    this.teamsApi.listPlayers(this.teamId, { limit: 500 }).subscribe({
      next: (rows) => {
        this.players = rows ?? [];
        this.loading = false;
      },
      error: (e: unknown) => {
        this.loading = false;
        const msg = e instanceof Error ? e.message : 'No se pudo cargar el roster.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        this.players = [];
      },
    });
  }

  get statusLabel(): string {
    return this.team?.active === false ? 'Inactivo' : 'Activo';
  }

  get statusSeverity(): 'success' | 'danger' {
    return this.team?.active === false ? 'danger' : 'success';
  }

  toggleActive(): void {
    if (!this.team || this.saving) return;

    this.saving = true;
    const nextActive = this.team.active === false;
    this.teamsApi.update(this.teamId, { active: nextActive }).subscribe({
      next: () => {
        this.saving = false;
        this.team = { ...this.team!, active: nextActive };
        this.toast.add({ severity: 'success', summary: 'Ok', detail: `Equipo ${nextActive ? 'activado' : 'desactivado'}.` });
      },
      error: (e: any) => {
        this.saving = false;
        const msg = e?.message || (e instanceof Error ? e.message : null) || 'No se pudo actualizar el estado.';
        // Honest UI hint for the min-players rule
        this.toast.add({
          severity: 'warn',
          summary: 'No se pudo activar',
          detail: msg + ' (Si intentas activar: necesitas al menos 5 jugadores asignados.)',
        });
      },
    });
  }

  openAddDialog(): void {
    this.addDialogOpen = true;
    this.playerSearch = '';
    this.searchResults = [];
    this.selectedSearchPlayerIds = [];
  }

  closeAddDialog(): void {
    this.addDialogOpen = false;
    this.selectedSearchPlayerIds = [];
  }

  searchPlayers(): void {
    const q = this.playerSearch.trim();
    if (!q) {
      this.searchResults = [];
      return;
    }

    this.searchLoading = true;
    this.playersApi.list({ search: q, limit: 50 }).subscribe({
      next: (rows) => {
        this.searchLoading = false;
        this.searchResults = (rows ?? []).map((p) => ({
          id: Number(p.id),
          name: (
            (p.name ?? null) ||
            `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() ||
            (p.email ?? null) ||
            `Jugador ${p.id}`
          ).toString(),
          email: p.email ?? null,
          position: p.position ?? null,
          category: p.category ?? null,
        }));

        // Drop selections that are no longer visible or are already in the team.
        const allowed = new Set(this.searchResults.filter((r) => !this.hasPlayer(r.id)).map((r) => r.id));
        this.selectedSearchPlayerIds = this.selectedSearchPlayerIds.filter((id) => allowed.has(id));
      },
      error: (e: unknown) => {
        this.searchLoading = false;
        const msg = e instanceof Error ? e.message : 'No se pudo buscar jugadores.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  toggleSearchSelection(userId: number): void {
    if (this.hasPlayer(userId)) return;
    const exists = this.selectedSearchPlayerIds.includes(userId);
    this.selectedSearchPlayerIds = exists
      ? this.selectedSearchPlayerIds.filter((id) => id !== userId)
      : [...this.selectedSearchPlayerIds, userId];
  }

  addSelectedPlayers(): void {
    if (this.saving) return;
    const ids = [...this.selectedSearchPlayerIds].filter((id) => !this.hasPlayer(id));
    if (!ids.length) return;

    this.saving = true;
    this.teamsApi.addPlayersBulk(this.teamId, ids).subscribe({
      next: (res) => {
        this.saving = false;
        const requested = res?.requested ?? ids.length;
        const created = res?.created ?? 0;
        const skipped = res?.skipped ?? Math.max(0, requested - created);

        if (created > 0) {
          this.toast.add({ severity: 'success', summary: 'Ok', detail: `Se añadieron ${created} jugador(es).` });
        }
        if (skipped > 0) {
          this.toast.add({ severity: 'warn', summary: 'Aviso', detail: `Se omitieron ${skipped} jugador(es) (ya estaban o no válidos).` });
        }

        this.selectedSearchPlayerIds = [];
        this.loadPlayers();
      },
      error: (e: unknown) => {
        // Honest UI fallback: if bulk isn't available for some reason, try sequential.
        const msg = e instanceof Error ? e.message : 'No se pudieron añadir los jugadores (bulk).';

        const pending = [...ids];
        let failed = 0;
        const assignNext = () => {
          const nextId = pending.shift();
          if (nextId == null) {
            this.saving = false;
            if (failed > 0) {
              this.toast.add({ severity: 'warn', summary: 'Aviso', detail: `${msg} Se reintentó 1 a 1 y fallaron ${failed}.` });
            } else {
              this.toast.add({ severity: 'warn', summary: 'Aviso', detail: `${msg} Se reintentó 1 a 1.` });
            }
            this.selectedSearchPlayerIds = [];
            this.loadPlayers();
            return;
          }

          this.teamsApi.addPlayer(this.teamId, nextId).subscribe({
            next: assignNext,
            error: () => {
              failed += 1;
              assignNext();
            },
          });
        };

        assignNext();
      },
    });
  }

  hasPlayer(userId: number): boolean {
    return this.players.some((p) => Number(p.id) === Number(userId));
  }

  addPlayer(userId: number): void {
    if (this.saving) return;
    if (this.hasPlayer(userId)) return;

    this.saving = true;
    this.teamsApi.addPlayer(this.teamId, userId).subscribe({
      next: () => {
        this.saving = false;
        this.toast.add({ severity: 'success', summary: 'Ok', detail: 'Jugador añadido.' });
        this.selectedSearchPlayerIds = this.selectedSearchPlayerIds.filter((id) => id !== userId);
        this.loadPlayers();
      },
      error: (e: unknown) => {
        this.saving = false;
        const msg = e instanceof Error ? e.message : 'No se pudo añadir el jugador.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  removePlayer(userId: number): void {
    if (this.saving) return;

    this.saving = true;
    this.teamsApi.removePlayer(this.teamId, userId).subscribe({
      next: () => {
        this.saving = false;
        this.toast.add({ severity: 'success', summary: 'Ok', detail: 'Jugador eliminado.' });
        this.loadPlayers();
      },
      error: (e: unknown) => {
        this.saving = false;
        const msg = e instanceof Error ? e.message : 'No se pudo eliminar el jugador.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
