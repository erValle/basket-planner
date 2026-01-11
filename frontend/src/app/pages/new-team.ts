import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';
import { ClubsApi, ClubDto } from '../services/clubs.api';
import { TeamsApi } from '../services/teams.api';
import { PlayersApi, PlayerDto } from '../services/players.api';

@Component({
  selector: 'app-new-team',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, ToastModule, AppShell, PageHeader],
  templateUrl: './new-team.html',
  styleUrl: './new-team.css',
  providers: [MessageService],
})
export class NewTeam {
  form = {
    name: '',
    season: '2025/26',
  };

  saving = false;
  clubs: ClubDto[] = [];
  selectedClubId: number | null = null;

  // Players selection
  playersLoading = false;
  playersError: string | null = null;
  players: Array<{ id: number; name: string; position?: string; category?: string; team?: string }> = [];
  selectedPlayerIds: number[] = [];

  // Filters
  filterName = '';
  filterPosition: string | null = null;
  filterCategory: string | null = null;
  filterTeam: string | null = null;
  teamOptions: Array<{ label: string; value: string }> = [];

  positionOptions = [
    { label: 'Base', value: 'base' },
    { label: 'Escolta', value: 'escolta' },
    { label: 'Alero', value: 'alero' },
    { label: 'Ala-pívot', value: 'ala-pivot' },
    { label: 'Pívot', value: 'pivot' },
  ];

  categoryOptions = [
    { label: 'Senior', value: 'senior' },
    { label: 'Juvenil', value: 'juvenil' },
    { label: 'Infantil', value: 'infantil' },
  ];

  constructor(
    private readonly router: Router,
    private readonly teamsApi: TeamsApi,
    private readonly clubsApi: ClubsApi,
    private readonly playersApi: PlayersApi,
    private readonly toast: MessageService,
  ) {
    // Load clubs to allow assigning the team.
    this.clubsApi.list().subscribe({
      next: (items) => {
        this.clubs = items ?? [];
        if (this.selectedClubId == null && this.clubs.length) this.selectedClubId = this.clubs[0].id;
      },
      error: () => {
        // club assignment will be optional if list fails
      },
    });

    this.loadPlayers();
    this.loadTeams();
  }

  private toUiPlayer(p: PlayerDto): { id: number; name: string; position?: string; category?: string; team?: string } {
    const fallbackName = `${(p.firstName ?? '').toString().trim()} ${(p.lastName ?? '').toString().trim()}`.trim();
    const name = ((p.name ?? '').toString().trim() || fallbackName || (p.email ?? '').toString().trim() || `Jugador ${p.id}`).trim();
    const firstTeam = Array.isArray(p.teams) && p.teams.length ? p.teams[0] : null;
    return {
      id: Number(p.id),
      name,
      position: (p.position ?? '').toString() || undefined,
      category: (p.category ?? firstTeam?.category ?? '').toString() || undefined,
      team: firstTeam?.name ? String(firstTeam.name) : undefined,
    };
  }

  private loadPlayers(): void {
    this.playersLoading = true;
    this.playersError = null;
    this.playersApi.list({ limit: 200 }).subscribe({
      next: (items) => {
        this.playersLoading = false;
        this.players = (items ?? []).map((p) => this.toUiPlayer(p));
      },
      error: (e: unknown) => {
        this.playersLoading = false;
        this.playersError = e instanceof Error ? e.message : 'No se pudieron cargar los jugadores.';
        this.players = [];
      },
    });
  }

  private loadTeams(): void {
    // Used only for filtering players by team.
    const clubId = this.selectedClubId;
    this.teamsApi.list({ clubId: clubId != null ? String(clubId) : undefined }).subscribe({
      next: (teams) => {
        this.teamOptions = (teams ?? []).map((t) => ({ label: t.name, value: String(t.id) }));
      },
      error: () => {
        this.teamOptions = [];
      },
    });
  }

  togglePlayerSelection(playerId: number): void {
    const exists = this.selectedPlayerIds.includes(playerId);
    this.selectedPlayerIds = exists ? this.selectedPlayerIds.filter((id) => id !== playerId) : [...this.selectedPlayerIds, playerId];
  }

  clearPlayerFilters(): void {
    this.filterName = '';
    this.filterPosition = null;
    this.filterCategory = null;
    this.filterTeam = null;
  }

  get filteredPlayers() {
    return this.players.filter((p) => {
      if (this.filterName && !p.name.toLowerCase().includes(this.filterName.toLowerCase())) return false;
      if (this.filterPosition && p.position !== this.filterPosition) return false;
      if (this.filterCategory && p.category !== this.filterCategory) return false;
      // Team filter is best-effort using player's denormalized first team name.
      if (this.filterTeam) {
        const selectedTeamName = this.teamOptions.find((t) => t.value === this.filterTeam)?.label;
        if (selectedTeamName && p.team !== selectedTeamName) return false;
      }
      return true;
    });
  }

  cancel() {
    this.router.navigateByUrl('/dashboard');
  }

  save() {
    if (this.saving) return;
    const name = this.form.name.trim();
    if (!name) {
      this.toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'El nombre es obligatorio.' });
      return;
    }
    if (this.selectedPlayerIds.length < 5) {
      this.toast.add({
        severity: 'warn',
        summary: 'Revisa la convocatoria',
        detail: 'Debes seleccionar al menos 5 jugadores para crear el equipo.',
      });
      return;
    }

    this.saving = true;
    this.teamsApi
      .create({
        name,
        clubId: this.selectedClubId ?? undefined,
        // Map season -> category for now (backend expects category).
        category: this.form.season?.trim() || null,
      })
      .subscribe({
        next: (created) => {
          const teamId = Number(created.id);

          // Assign players in one call.
          this.teamsApi.addPlayersBulk(teamId, [...this.selectedPlayerIds]).subscribe({
            next: (res) => {
              if ((res?.requested ?? this.selectedPlayerIds.length) !== (res?.created ?? this.selectedPlayerIds.length)) {
                const requested = res?.requested ?? this.selectedPlayerIds.length;
                const createdCount = res?.created ?? 0;
                const skipped = res?.skipped ?? Math.max(0, requested - createdCount);
                this.toast.add({
                  severity: 'warn',
                  summary: 'Equipo creado con avisos',
                  detail: `Se asignaron ${createdCount}/${requested} jugadores (omitidos: ${skipped}).`,
                });
              }

              // After players are assigned, activate the team.
              this.teamsApi.update(teamId, { active: true } as any).subscribe({
                next: () => {
                  this.saving = false;
                  this.toast.add({ severity: 'success', summary: 'Equipo creado', detail: `#${created.id} · ${created.name}` });
                  this.router.navigateByUrl('/teams');
                },
                error: (e: unknown) => {
                  this.saving = false;
                  const msg = e instanceof Error ? e.message : 'El equipo se creó pero no se pudo activar.';
                  this.toast.add({ severity: 'warn', summary: 'Atención', detail: msg });
                  this.router.navigateByUrl('/teams');
                },
              });
            },
            error: (e: unknown) => {
              // Honest UI: team is created but roster assignment failed.
              this.saving = false;
              const msg = e instanceof Error ? e.message : 'El equipo se creó, pero no se pudieron asignar los jugadores.';
              this.toast.add({ severity: 'warn', summary: 'Atención', detail: msg });
              this.router.navigateByUrl('/teams');
            },
          });
        },
        error: (e: unknown) => {
          this.saving = false;
          const msg = e instanceof Error ? e.message : 'No se pudo crear el equipo.';
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
  }

}
