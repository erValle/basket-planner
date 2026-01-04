import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { PageHeader } from '../components/page-header/page-header';
import { AppShell } from '../layout/app-shell/app-shell';
import { ClubContextService } from '../core/context/club-context.service';
import { ClubsApi, ClubDto } from '../services/clubs.api';
import { TeamsApi, TeamDto } from '../services/teams.api';

@Component({
  selector: 'app-teams',
	imports: [CommonModule, FormsModule, RouterLink, ButtonModule, DialogModule, InputTextModule, SelectModule, TagModule, ToastModule, PageHeader, AppShell],
  providers: [MessageService],
  templateUrl: './teams.html',
  styleUrl: './teams.css',
})
export class Teams {
  private readonly api = inject(TeamsApi);
  private readonly clubsApi = inject(ClubsApi);
  private readonly toast = inject(MessageService);
  private readonly clubContext = inject(ClubContextService);

  loading = false;

  clubs: ClubDto[] = [];
  clubOptions: Array<{ label: string; value: number }> = [];

  clubOptionsWithAll = [{ label: 'Todos', value: 'all' }, ...this.clubOptions];

  categoryOptions = [
    { label: 'Todas', value: 'all' },
    { label: 'Senior', value: 'Senior' },
    { label: 'Junior', value: 'Junior' },
    { label: 'Juvenil', value: 'Juvenil' },
  ];

  categoryOptionsWithoutAll = this.categoryOptions.filter((opt) => opt.value !== 'all');

  filters = {
    club: 'all',
    category: 'all',
    search: '',
  };

  teams: Array<{ id: number; name: string; clubId: number | null; clubName: string; category: string; status: 'active' | 'inactive'; players: number }> = [];

  teamDialogVisible = false;
  dialogMode: 'create' | 'edit' = 'create';

  draft = {
    id: 0,
    name: '',
    clubId: 0 as number,
    club: '',
    category: 'Senior',
    status: 'active' as 'active' | 'inactive',
    players: 0,
  };

  constructor() {
    this.loadClubs();
    this.loadTeams();

    // Keep list aligned with the global club selector.
    this.clubContext.selectedClubId$.subscribe((clubId) => {
      if (clubId == null) return;
      this.filters.club = String(clubId);
      this.loadTeams();
    });
  }

  private clubNameById(id: number | null | undefined): string {
    if (!id) return '';
    const c = this.clubs.find((x) => Number(x.id) === Number(id));
    return c?.name ?? '';
  }

  private toUiTeam(t: TeamDto): { id: number; name: string; clubId: number | null; clubName: string; category: string; status: 'active' | 'inactive'; players: number } {
    return {
      id: Number(t.id),
      name: t.name,
      clubId: t.clubId ?? null,
      clubName: this.clubNameById(t.clubId ?? null),
      category: (t.category ?? '').toString(),
      status: t.active === false ? 'inactive' : 'active',
      players: typeof t.playersCount === 'number' ? t.playersCount : 0,
    };
  }

  loadClubs(): void {
    this.clubsApi.list().subscribe({
      next: (items) => {
        this.clubs = items ?? [];
        this.clubOptions = (items ?? []).map((c) => ({ label: c.name, value: Number(c.id) }));
        this.clubOptionsWithAll = [{ label: 'Todos', value: 'all' }, ...this.clubOptions.map((o) => ({ label: o.label, value: o.value }))];

        // Default del draft: primer club disponible
        if (!this.draft.clubId && this.clubOptions.length) {
          this.draft.clubId = this.clubOptions[0].value;
          this.draft.club = this.clubNameById(this.draft.clubId);
        }

        // Recalcular nombres de club en equipos ya cargados
        this.teams = this.teams.map((t) => ({ ...t, clubName: this.clubNameById(t.clubId) }));
      },
      error: (e: unknown) => {
        const msg = e instanceof Error ? e.message : 'No se pudieron cargar los clubes.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  loadTeams(): void {
    this.loading = true;

    const clubId = this.filters.club !== 'all' ? String(this.filters.club) : undefined;
    const category = this.filters.category !== 'all' ? String(this.filters.category) : undefined;

    this.api.list({ clubId, category }).subscribe({
      next: (items) => {
        this.loading = false;
        this.teams = (items ?? []).map((t) => this.toUiTeam(t));
      },
      error: (e: unknown) => {
        this.loading = false;
        const msg = e instanceof Error ? e.message : 'No se pudieron cargar los equipos.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  get filteredTeams() {
    const q = this.filters.search.trim().toLowerCase();
    return this.teams.filter((t) => {
      const matchesQuery = !q || t.name.toLowerCase().includes(q);
      // Note: server-side club/category filtering is applied in loadTeams; keep client-side search only.
      const matchesClub = true;
      const matchesCat = true;
      return matchesQuery && matchesClub && matchesCat;
    });
  }

  clearFilters(): void {
    this.filters.club = 'all';
    this.filters.category = 'all';
    this.filters.search = '';
  }

  openCreate(): void {
    this.dialogMode = 'create';
    this.draft = {
      id: 0,
      name: '',
      clubId: this.clubOptions[0]?.value ?? 0,
      club: this.clubNameById(this.clubOptions[0]?.value ?? null),
      category: 'Senior',
      status: 'active',
      players: 0,
    };
    this.teamDialogVisible = true;
  }

  openEdit(item: (typeof this.teams)[number]): void {
    this.dialogMode = 'edit';
    this.draft = { id: item.id, name: item.name, clubId: item.clubId ?? 0, club: item.clubName, category: item.category ?? 'Senior', status: item.status, players: item.players };
    this.teamDialogVisible = true;
  }

  closeDialog(): void {
    this.teamDialogVisible = false;
  }

  saveDialog(): void {
    const name = this.draft.name.trim();
    if (!name) return;

    const clubId = this.draft.clubId ? Number(this.draft.clubId) : null;
    const payload = { name, clubId, category: this.draft.category || null, active: this.draft.status === 'active' };

    if (this.dialogMode === 'create') {
      this.api.create(payload).subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'Ok', detail: 'Equipo creado.' });
          this.closeDialog();
          this.loadTeams();
        },
        error: (e: unknown) => {
          const msg = e instanceof Error ? e.message : 'No se pudo crear el equipo.';
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
      return;
    }

    this.api.update(this.draft.id, payload).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Ok', detail: 'Equipo actualizado.' });
        this.closeDialog();
        this.loadTeams();
      },
      error: (e: unknown) => {
        const msg = e instanceof Error ? e.message : 'No se pudo actualizar el equipo.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
