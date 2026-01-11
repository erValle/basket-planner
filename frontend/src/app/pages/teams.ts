import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { PageHeader } from '../components/page-header/page-header';
import { BpDialog } from '../components/bp-dialog/bp-dialog';
import { AppShell } from '../layout/app-shell/app-shell';
import { ClubContextService } from '../core/context/club-context.service';
import { ClubsApi, ClubDto } from '../services/clubs.api';
import { TeamsApi, TeamDto } from '../services/teams.api';
import { UsersApiService } from '../services/users.api';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-teams',
	imports: [CommonModule, FormsModule, RouterLink, ButtonModule, BpDialog, InputTextModule, SelectModule, TagModule, ToastModule, PageHeader, AppShell],
  providers: [MessageService],
  templateUrl: './teams.html',
  styleUrl: './teams.css',
})
export class Teams {
  private readonly api = inject(TeamsApi);
  private readonly clubsApi = inject(ClubsApi);
  private readonly usersApi = inject(UsersApiService);
  private readonly toast = inject(MessageService);
  private readonly clubContext = inject(ClubContextService);

  private readonly refresh$ = new BehaviorSubject<void>(undefined);
  private readonly loading$ = new BehaviorSubject<boolean>(true);

  clubs: ClubDto[] = [];
  clubOptions: Array<{ label: string; value: number }> = [];
  coachOptions: Array<{ label: string; value: number | null }> = [{ label: 'Sin entrenador', value: null }];

  // Note: initialized empty; set when clubs are loaded.
  clubOptionsWithAll: Array<{ label: string; value: 'all' | number }> = [{ label: 'Todos', value: 'all' }];

  categoryOptions = [
    { label: 'Todas', value: 'all' },
    { label: 'Senior', value: 'Senior' },
    { label: 'Juvenil', value: 'Juvenil' },
    { label: 'Infantil', value: 'Infantil' },
  ];

  categoryOptionsWithoutAll = this.categoryOptions.filter((opt) => opt.value !== 'all');

  filters = {
    club: 'all' as 'all' | number | string,
    category: 'all',
    search: '',
  };

  teams$ = this.refresh$.pipe(
    switchMap(() => {
      this.loading$.next(true);
      const clubId = this.filters.club !== 'all' ? String(this.filters.club) : undefined;
      const category = this.filters.category !== 'all' ? String(this.filters.category) : undefined;
      return this.api.list({ clubId, category }).pipe(
        map((items) => (items ?? []).map((t) => this.toUiTeam(t))),
        catchError((e: unknown) => {
          const msg = e instanceof Error ? e.message : 'No se pudieron cargar los equipos.';
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
          return of([] as Array<{ id: number; name: string; clubId: number | null; clubName: string; category: string; status: 'active' | 'inactive'; players: number }>);
        }),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  vm$ = combineLatest([this.teams$, this.loading$.pipe(startWith(true))]).pipe(
    map(([teams, loading]) => {
      const q = this.filters.search.trim().toLowerCase();
      const filtered = teams.filter((t) => {
        const matchesQuery = !q || t.name.toLowerCase().includes(q);
        return matchesQuery;
      });
      return { teams, filtered, loading: Boolean(loading) };
    }),
    startWith({ teams: [], filtered: [], loading: true as const }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  teamDialogVisible = false;
  dialogMode: 'create' | 'edit' = 'create';

  draft = {
    id: 0,
    name: '',
    clubId: 0 as number,
    club: '',
    coachId: null as number | null,
    category: 'Senior',
    status: 'active' as 'active' | 'inactive',
    players: 0,
  };

  constructor() {
    this.loadClubs();
    this.loadCoaches();
    this.refresh();

    // Keep list aligned with the global club selector.
    this.clubContext.selectedClubId$.subscribe((clubId) => {
      // Important: the global selector might not have any club selected (or the user isn't in any club).
      // In that case, we must NOT filter by clubId, otherwise we'd get an empty list.
      if (clubId == null) {
        this.filters.club = 'all';
        this.refresh();
        return;
      }

      this.filters.club = clubId;
      this.refresh();
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

        // Teams list is now async-driven; the mapping in toUiTeam already uses clubNameById.
      },
      error: (e: unknown) => {
        const msg = e instanceof Error ? e.message : 'No se pudieron cargar los clubes.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  loadCoaches(): void {
    this.usersApi.list({ role: 'coach' }).subscribe({
      next: (items: any[]) => {
        const coaches = (items ?? []).map((u: any) => ({
          label: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || `Usuario ${u.id}`,
          value: Number(u.id),
        }));
        this.coachOptions = [{ label: 'Sin entrenador', value: null }, ...coaches];
      },
      error: () => {
        // Silently fail, keep default option
      },
    });
  }

  loadTeams(): void {
    // kept for backwards-compat; delegate to refresh()
    this.refresh();
  }

  refresh(): void {
    this.refresh$.next();
  }

  get filteredTeams() {
    // Deprecated in zoneless mode; UI should use vm$ | async.
    return [];
  }

  clearFilters(): void {
    this.filters.club = 'all';
    this.filters.category = 'all';
    this.filters.search = '';
    this.refresh();
  }

  openCreate(): void {
    this.dialogMode = 'create';
    this.draft = {
      id: 0,
      name: '',
      clubId: this.clubOptions[0]?.value ?? 0,
      club: this.clubNameById(this.clubOptions[0]?.value ?? null),
      coachId: null,
      category: 'Senior',
      status: 'active',
      players: 0,
    };
    this.teamDialogVisible = true;
  }

  openEdit(item: { id: number; name: string; clubId: number | null; clubName: string; coachId?: number | null; category: string; status: 'active' | 'inactive'; players: number }): void {
    this.dialogMode = 'edit';
    this.draft = { id: item.id, name: item.name, clubId: item.clubId ?? 0, club: item.clubName, coachId: item.coachId ?? null, category: item.category ?? 'Senior', status: item.status, players: item.players };
    this.teamDialogVisible = true;
  }

  closeDialog(): void {
    this.teamDialogVisible = false;
  }

  saveDialog(): void {
    const name = this.draft.name.trim();
    if (!name) return;

    const clubId = this.draft.clubId ? Number(this.draft.clubId) : null;
    const coachId = this.draft.coachId ? Number(this.draft.coachId) : null;
    const payload = { name, clubId, coachId, category: this.draft.category || null, active: this.draft.status === 'active' };

    if (this.dialogMode === 'create') {
      this.api.create(payload).subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'Ok', detail: 'Equipo creado.' });
          this.closeDialog();
          this.refresh();
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
        this.refresh();
      },
      error: (e: unknown) => {
        const msg = e instanceof Error ? e.message : 'No se pudo actualizar el equipo.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
