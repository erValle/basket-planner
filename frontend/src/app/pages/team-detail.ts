import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';
import { BpDialog } from '../components/bp-dialog/bp-dialog';
import { TeamsApi, TeamDto, TeamPlayerDto } from '../services/teams.api';
import { PlayersApi, PlayerDto } from '../services/players.api';
import { AuthService } from '../core/auth/auth.service';
import { hasRole } from '../core/auth/roles';

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
    BpDialog,
    AppShell,
    PageHeader,
  ],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css',
  providers: [MessageService],
})
export class TeamDetail {
  teamId: number;

  loading = signal(false);
  saving = signal(false);

  team = signal<TeamDto | null>(null);
  players = signal<TeamPlayerDto[]>([]);

  // Add player dialog
  addDialogOpen = signal(false);
  playerSearch = signal('');
  searchLoading = signal(false);
  availablePlayers = signal<PlayerDto[]>([]);
  selectedPlayerIds = signal<number[]>([]);

  statusLabel = computed(() => this.team()?.active === false ? 'Inactivo' : 'Activo');
  statusSeverity = computed(() => this.team()?.active === false ? 'danger' : 'success' as const);

  constructor(
    route: ActivatedRoute,
    private readonly router: Router,
    private readonly teamsApi: TeamsApi,
    private readonly playersApi: PlayersApi,
    private readonly toast: MessageService,
    private readonly auth: AuthService,
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

    this.loading.set(true);
    this.teamsApi.get(this.teamId).subscribe({
      next: (t: TeamDto) => {
        this.team.set(t);
        this.loadPlayers();
      },
      error: (e: unknown) => {
        this.loading.set(false);
        const msg = e instanceof Error ? e.message : 'No se pudo cargar el equipo.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  private loadPlayers(): void {
    this.teamsApi.listPlayers(this.teamId, { limit: 500 }).subscribe({
      next: (rows) => {
        this.players.set(rows ?? []);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        this.loading.set(false);
        const msg = e instanceof Error ? e.message : 'No se pudo cargar el roster.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        this.players.set([]);
      },
    });
  }

  canManagePlayers(): boolean {
    const userRole = this.auth.getRoleSnapshot();
    return hasRole(userRole, ['admin', 'technical_director', 'coach']);
  }

  toggleActive(): void {
    const currentTeam = this.team();
    if (!currentTeam || this.saving()) return;

    this.saving.set(true);
    const nextActive = currentTeam.active === false;
    this.teamsApi.update(this.teamId, { active: nextActive }).subscribe({
      next: () => {
        this.saving.set(false);
        this.team.set({ ...currentTeam, active: nextActive });
        this.toast.add({ severity: 'success', summary: 'Ok', detail: `Equipo ${nextActive ? 'activado' : 'desactivado'}.` });
      },
      error: (e: any) => {
        this.saving.set(false);
        const msg = e?.message || (e instanceof Error ? e.message : null) || 'No se pudo actualizar el estado.';
        this.toast.add({
          severity: 'warn',
          summary: 'No se pudo activar',
          detail: msg + ' (Si intentas activar: necesitas al menos 5 jugadores asignados.)',
        });
      },
    });
  }

  openAddDialog(): void {
    const currentTeam = this.team();
    if (!currentTeam?.clubId) {
      this.toast.add({ severity: 'warn', summary: 'Aviso', detail: 'El equipo no tiene un club asignado.' });
      return;
    }

    this.addDialogOpen.set(true);
    this.playerSearch.set('');
    this.selectedPlayerIds.set([]);
    this.loadAvailablePlayers(currentTeam.clubId);
  }

  closeAddDialog(): void {
    this.addDialogOpen.set(false);
    this.selectedPlayerIds.set([]);
  }

  private loadAvailablePlayers(clubId: number): void {
    this.searchLoading.set(true);
    this.playersApi.list({ clubId: clubId.toString(), withoutTeam: true, limit: 200 }).subscribe({
      next: (rows) => {
        this.searchLoading.set(false);
        this.availablePlayers.set(rows ?? []);
      },
      error: (e: unknown) => {
        this.searchLoading.set(false);
        const msg = e instanceof Error ? e.message : 'No se pudo cargar los jugadores disponibles.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        this.availablePlayers.set([]);
      },
    });
  }

  searchInAvailable(): void {
    const search = this.playerSearch().trim().toLowerCase();
    // This is just for UI filtering, the main filter is in loadAvailablePlayers
  }

  toggleSelection(playerId: number): void {
    const current = this.selectedPlayerIds();
    if (current.includes(playerId)) {
      this.selectedPlayerIds.set(current.filter(id => id !== playerId));
    } else {
      this.selectedPlayerIds.set([...current, playerId]);
    }
  }

  isSelected(playerId: number): boolean {
    return this.selectedPlayerIds().includes(playerId);
  }

  filteredAvailablePlayers = computed(() => {
    const search = this.playerSearch().trim().toLowerCase();
    const players = this.availablePlayers();
    if (!search) return players;

    return players.filter(p => {
      const name = `${p.firstName || ''} ${p.lastName || ''}`.trim().toLowerCase();
      const email = (p.email || '').toLowerCase();
      return name.includes(search) || email.includes(search);
    });
  });

  addSelectedPlayers(): void {
    if (this.saving()) return;
    const ids = this.selectedPlayerIds().filter((id) => !this.hasPlayer(id));
    if (!ids.length) return;

    this.saving.set(true);
    this.teamsApi.addPlayersBulk(this.teamId, ids).subscribe({
      next: (res) => {
        this.saving.set(false);
        const requested = res?.requested ?? ids.length;
        const created = res?.created ?? 0;
        const skipped = res?.skipped ?? Math.max(0, requested - created);

        if (created > 0) {
          this.toast.add({ severity: 'success', summary: 'Ok', detail: `Se añadieron ${created} jugador(es).` });
        }
        if (skipped > 0) {
          this.toast.add({ severity: 'warn', summary: 'Aviso', detail: `Se omitieron ${skipped} jugador(es) (ya estaban o no válidos).` });
        }

        this.selectedPlayerIds.set([]);
        this.closeAddDialog();
        this.loadPlayers();
        this.load(); // Recargar el equipo para actualizar el contador
      },
      error: (e: unknown) => {
        this.saving.set(false);
        const msg = e instanceof Error ? e.message : 'No se pudieron añadir los jugadores.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  hasPlayer(userId: number): boolean {
    return this.players().some((p) => Number(p.id) === Number(userId));
  }

  addPlayer(userId: number): void {
    if (this.saving()) return;
    if (this.hasPlayer(userId)) return;

    this.saving.set(true);
    this.teamsApi.addPlayer(this.teamId, userId).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.add({ severity: 'success', summary: 'Ok', detail: 'Jugador añadido.' });
        this.selectedPlayerIds.update(ids => ids.filter((id) => id !== userId));
        this.loadPlayers();
        this.load(); // Recargar el equipo para actualizar el contador
      },
      error: (e: unknown) => {
        this.saving.set(false);
        const msg = e instanceof Error ? e.message : 'No se pudo añadir el jugador.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  removePlayer(userId: number): void {
    if (this.saving()) return;

    this.saving.set(true);
    this.teamsApi.removePlayer(this.teamId, userId).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.add({ severity: 'success', summary: 'Ok', detail: 'Jugador eliminado.' });
        this.loadPlayers();
        this.load(); // Recargar el equipo para actualizar el contador
      },
      error: (e: unknown) => {
        this.saving.set(false);
        const msg = e instanceof Error ? e.message : 'No se pudo eliminar el jugador.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
