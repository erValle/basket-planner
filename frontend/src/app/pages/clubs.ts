import { Component, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { PageHeader } from '../components/page-header/page-header';
import { BpDialog } from '../components/bp-dialog/bp-dialog';
import { AppShell } from '../layout/app-shell/app-shell';
import { ClubsApi, ClubDto } from '../services/clubs.api';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-clubs',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    BpDialog,
    InputTextModule,
    SelectModule,
    TagModule,
    ToastModule,
    PageHeader,
    AppShell,
  ],
  providers: [MessageService],
  templateUrl: './clubs.html',
  styleUrl: './clubs.scss',
})
export class Clubs {
  private readonly api = inject(ClubsApi);
  private readonly toast = inject(MessageService);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly refresh$ = new BehaviorSubject<void>(undefined);
  private readonly loading$ = new BehaviorSubject<boolean>(true);

  filters = {
    search: '',
    status: 'all' as 'all' | 'active' | 'inactive',
  };

  statusOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' },
  ];

  clubs$ = this.refresh$.pipe(
    switchMap(() => {
      this.zone.run(() => {
        this.loading$.next(true);
        this.cdr.detectChanges();
      });
      return this.api.list().pipe(
        map((items) => (items ?? []).map((c) => this.toUiClub(c))),
        tap(() => {
          this.zone.run(() => {
            this.loading$.next(false);
            this.cdr.detectChanges();
          });
        }),
        catchError((e: unknown) => {
          this.zone.run(() => {
            const msg = e instanceof Error ? e.message : 'No se pudieron cargar los clubes.';
            this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
            this.loading$.next(false);
            this.cdr.detectChanges();
          });
          return of([] as Array<{ id: number; name: string; city: string; status: 'active' | 'inactive'; teams: number }>);
        }),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  vm$ = combineLatest([
    this.clubs$,
    this.loading$.pipe(startWith(true)),
  ]).pipe(
    map(([clubs, loading]) => {
      const q = this.filters.search.trim().toLowerCase();
      const filtered = clubs.filter((c) => {
        const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
        const matchesStatus = this.filters.status === 'all' || c.status === this.filters.status;
        return matchesQuery && matchesStatus;
      });
      return { clubs, filtered, loading: Boolean(loading) };
    }),
    startWith({ clubs: [], filtered: [], loading: true as const }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  clubDialogVisible = false;
  dialogMode: 'create' | 'edit' = 'create';

  draft = {
    id: 0,
    name: '',
    city: '',
    status: 'active' as 'active' | 'inactive',
    teams: 0,
  };

  constructor() {
    this.refresh();
  }

  private toUiClub(c: ClubDto): { id: number; name: string; city: string; status: 'active' | 'inactive'; teams: number } {
    return {
      id: Number(c.id),
      name: c.name,
      city: (c.city ?? '').toString(),
      status: c.active === false ? 'inactive' : 'active',
      teams: typeof c.teamsCount === 'number' ? c.teamsCount : 0,
    };
  }

  refresh(): void {
    this.refresh$.next();
  }

  clearFilters(): void {
    this.filters.search = '';
    this.filters.status = 'all';
  }

  openCreate(): void {
    this.dialogMode = 'create';
    this.draft = { id: 0, name: '', city: '', status: 'active', teams: 0 };
    this.clubDialogVisible = true;
  }

  openEdit(item: { id: number; name: string; city: string; status: 'active' | 'inactive'; teams: number }): void {
    this.dialogMode = 'edit';
    this.draft = { ...item };
    this.clubDialogVisible = true;
  }

  closeDialog(): void {
    this.clubDialogVisible = false;
  }

  saveDialog(): void {
    const name = this.draft.name.trim();
    if (!name) return;

    const payload = { name, city: this.draft.city.trim() || null, status: this.draft.status };

    if (this.dialogMode === 'create') {
      this.api.create(payload).subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'Ok', detail: 'Club creado.' });
          this.closeDialog();
          this.refresh();
        },
        error: (e: unknown) => {
          const msg = e instanceof Error ? e.message : 'No se pudo crear el club.';
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
      return;
    }

    this.api.update(this.draft.id, payload).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Ok', detail: 'Club actualizado.' });
        this.closeDialog();
        this.refresh();
      },
      error: (e: unknown) => {
        const msg = e instanceof Error ? e.message : 'No se pudo actualizar el club.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
