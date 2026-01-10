import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { BpDialog } from '../components/bp-dialog';
import { PlayerDetail, PlayerDetailModel } from '../modals/player-detail/player-detail';
import { PlayerSelection, PlayerSelectionItem } from '../modals/player-selection/player-selection';

import { PageHeader } from '../components/page-header/page-header';
import { AppShell } from '../layout/app-shell/app-shell';

import { PlayerDto, PlayersApi } from '../services/players.api';
import { ClubsApi, ClubDto } from '../services/clubs.api';
import { TeamsApi, TeamDto } from '../services/teams.api';
import { UsersApiService } from '../services/users.api';
import { ClubContextService } from '../core/context/club-context.service';
import { BehaviorSubject, combineLatest, map, shareReplay, startWith, switchMap } from 'rxjs';

type PlayerStatus = 'active' | 'revision';

interface Player {
  id: string;
  name: string;
  team: string;
  category: string;
  position: string;
  status: PlayerStatus;
  firstName: string;
  lastName: string;
  birthDate: string;
  dni: string;
  height: number;
  weight: number;
  dominantHand: string;
  club: string;
  currentTeam: string;
  weeklyLoad: string;
  lastFeedback: string;
  notes: string;
}

type Option = { label: string; value: string };

@Component({
  selector: 'app-players',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    BpDialog,
    TagModule,
    PlayerDetail,
    PlayerSelection,
		PageHeader,
		AppShell,
  ],
  templateUrl: './players.html',
  styleUrl: './players.css',
})
export class Players {
  private readonly playersApi = inject(PlayersApi);
  private readonly clubsApi = inject(ClubsApi);
  private readonly teamsApi = inject(TeamsApi);
  private readonly usersApi = inject(UsersApiService);
  private readonly clubContext = inject(ClubContextService);

  selectedPlayer: PlayerDetailModel | null = null;
  playerDetailVisible = false;

  playerSelectionVisible = false;
  selectedPlayerIds: string[] = [];

  availablePlayersForSelection: PlayerSelectionItem[] = [];
  selectionLoading = false;
  selectionError: string | null = null;

  clubs: ClubDto[] = [];
  teams: TeamDto[] = [];

  clubOptions: Option[] = [{ label: 'Todos', value: 'all' }];
  teamOptions: Option[] = [{ label: 'Todos', value: 'all' }];

  categoryOptions: Option[] = [
    { label: 'Todas', value: 'Todas' },
    { label: 'Senior', value: 'Senior' },
    { label: 'U18', value: 'U18' },
  ];

  filters = {
    club: 'all',
    team: 'all',
    category: 'Todas',
    search: '',
  };

  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly loadError$ = new BehaviorSubject<string | null>(null);

  private readonly players$ = this.refresh$.pipe(
    switchMap(() => {
      this.loading$.next(true);
      this.loadError$.next(null);

      const clubId = this.filters.club !== 'all' ? this.filters.club : undefined;
      const teamId = this.filters.team !== 'all' ? this.filters.team : undefined;

      return this.playersApi
        .list({ search: this.filters.search || undefined, clubId, teamId, limit: 200 })
        .pipe(
          map((items: PlayerDto[] | null | undefined) => (items ?? []).map((p: PlayerDto) => this.toUiPlayer(p))),
          map((items) => {
            this.loading$.next(false);
            return items;
          }),
        );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly vm$ = combineLatest({
    items: this.players$,
    loading: this.loading$.pipe(startWith(false)),
    error: this.loadError$.pipe(startWith(null)),
    tick: this.refresh$.pipe(startWith(undefined)),
  }).pipe(
    map(({ items, loading, error }) => {
      const filtered = items.filter((player) => {
        const matchesCategory = this.filters.category === 'Todas' || player.category === this.filters.category;
        const matchesSearch =
          this.filters.search === '' || player.name.toLowerCase().includes(this.filters.search.toLowerCase());
        // club/team are now server-filtered; keep category/search local for now.
        return matchesCategory && matchesSearch;
      });

      return { items, filtered, loading, error };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  savingPlayer = false;
  saveError: string | null = null;

  constructor() {
    this.loadFilters();
    this.refresh();
  }

  private toSelectionItem(u: any): PlayerSelectionItem {
    const name = (u?.name ?? '').toString().trim() || (u?.email ?? '').toString().trim() || `Usuario ${u?.id}`;
    return {
      id: String(u?.id),
      nombre: name,
      posicion: '—',
      categoria: 'Sin rol',
    };
  }

  private loadUnassignedUsers(): void {
    this.selectionLoading = true;
    this.selectionError = null;

    this.usersApi.list({ role: 'none', page: 1, pageSize: 200 } as any).subscribe({
      next: (res: any) => {
        this.selectionLoading = false;
        const items = Array.isArray(res?.items) ? res.items : [];
        this.availablePlayersForSelection = items.map((u: any) => this.toSelectionItem(u));
      },
      error: (e: unknown) => {
        this.selectionLoading = false;
        this.selectionError = e instanceof Error ? e.message : 'No se pudieron cargar usuarios sin rol.';
        this.availablePlayersForSelection = [];
      },
    });
  }

  private loadFilters(): void {
    const selectedClubId = this.clubContext.getSelectedClubIdSnapshot();
    if (selectedClubId != null) {
      this.filters.club = String(selectedClubId);
    }

    this.clubsApi.list().subscribe({
      next: (items) => {
        this.clubs = items ?? [];

        const scopedClubs = selectedClubId != null ? this.clubs.filter((c) => Number(c.id) === Number(selectedClubId)) : this.clubs;
        this.clubOptions = [{ label: 'Todos', value: 'all' }, ...scopedClubs.map((c) => ({ label: c.name, value: String(c.id) }))];
      },
      error: () => {
        // keep defaults
      },
    });

    this.teamsApi.list({ clubId: selectedClubId != null ? String(selectedClubId) : undefined }).subscribe({
      next: (items) => {
        this.teams = items ?? [];
        this.teamOptions = [
          { label: 'Todos', value: 'all' },
          ...this.teams.map((t) => ({ label: t.name, value: String(t.id) })),
        ];
      },
      error: () => {
        // keep defaults
      },
    });
  }

  private toUiPlayer(p: PlayerDto): PlayerDetailModel {
    const rawName = (p.name ?? '').toString().trim();
    const email = (p.email ?? '').toString().trim();
    const fallbackName = `${(p.firstName ?? '').toString().trim()} ${(p.lastName ?? '').toString().trim()}`.trim();
    const name = rawName || fallbackName || email || `Jugador ${p.id}`;

    const [firstName, ...rest] = name.split(' ').filter(Boolean);
    const lastName = rest.join(' ');

    const firstTeam = Array.isArray(p.teams) && p.teams.length ? p.teams[0] : null;
    const firstClub = Array.isArray(p.clubs) && p.clubs.length ? p.clubs[0] : null;

    // Parse dateOfBirth to a display format (YYYY-MM-DD or empty)
    let birthDateDisplay = '';
    if (p.dateOfBirth) {
      const d = new Date(p.dateOfBirth);
      if (!isNaN(d.getTime())) {
        birthDateDisplay = d.toISOString().split('T')[0];
      }
    }

    return {
      id: String(p.id),
      name,
      team: firstTeam?.name ?? '',
      category: (p.category ?? firstTeam?.category ?? '').toString(),
      position: (p.position ?? '').toString(),
      status: (p.status === 'active' ? 'active' : p.status ? 'revision' : 'active'),
      firstName: firstName ?? '',
      lastName,
      birthDate: birthDateDisplay,
      dni: '',
      height: p.height ?? 0,
      weight: 0,
      dominantHand: '',
      club: firstClub?.name ?? '',
      currentTeam: firstTeam ? `${firstTeam.name}${firstTeam.category ? ` - ${firstTeam.category}` : ''}` : '',
      weeklyLoad: '',
      lastFeedback: '',
      notes: '',
    };
  }

  refresh(): void {
    this.refresh$.next();
  }

  clearFilters() {
    this.filters = { club: 'all', team: 'all', category: 'Todas', search: '' };
    this.refresh();
  }

  openPlayer(player: PlayerDetailModel) {
    this.selectedPlayer = structuredClone(player);
    this.playerDetailVisible = true;
  }

  closePlayer() {
    this.playerDetailVisible = false;
    this.selectedPlayer = null;
  }

  // ---- Selection flow (kept imperative; UI renders from simple fields) ----
  openPlayerSelection() {
    this.playerSelectionVisible = true;
    this.selectedPlayerIds = [];
    this.loadUnassignedUsers();
  }

  closePlayerSelection() {
    this.playerSelectionVisible = false;
  }

  async confirmPlayerSelection(selectedIds: string[]) {
    // This feature is currently best-effort: we just close and refresh the list.
    // (Assigning users to teams/clubs depends on backend capabilities.)
    this.selectedPlayerIds = selectedIds ?? [];
    this.playerSelectionVisible = false;
    this.refresh();
  }

  savePlayer(updated: PlayerDetailModel) {
    // Use the dedicated player profile API for sports-specific fields
    const payload: {
      status?: string;
      position?: string | null;
      category?: string | null;
      height?: number | null;
      dateOfBirth?: string | null;
    } = {
      status: updated.status === 'active' ? 'active' : 'pending',
      position: updated.position || null,
      category: updated.category || null,
      height: updated.height || null,
      dateOfBirth: updated.birthDate || null,
    };

    this.savingPlayer = true;
    this.saveError = null;

    this.playersApi.updateProfile(updated.id, payload).subscribe({
      next: () => {
        this.savingPlayer = false;
        this.closePlayer();
        this.refresh();
      },
      error: (e: unknown) => {
        this.savingPlayer = false;
        this.saveError = e instanceof Error ? e.message : 'No se pudo guardar el jugador.';
        console.error('[players] savePlayer error', this.saveError);
        // Keep modal open so user can retry
      },
    });
  }
}
