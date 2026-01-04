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
import { ClubsApi, ClubDto } from '../services/clubs.api';

@Component({
  selector: 'app-clubs',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ToastModule,
    PageHeader,
    AppShell,
  ],
  providers: [MessageService],
  templateUrl: './clubs.html',
  styleUrl: './clubs.css',
})
export class Clubs {
  private readonly api = inject(ClubsApi);
  private readonly toast = inject(MessageService);

  filters = {
    search: '',
    status: 'all' as 'all' | 'active' | 'inactive',
  };

  statusOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' },
  ];

  loading = false;

  clubs: Array<{ id: number; name: string; city: string; status: 'active' | 'inactive'; teams: number }> = [];

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
    this.load();
  }

  private toUiClub(c: ClubDto): { id: number; name: string; city: string; status: 'active' | 'inactive'; teams: number } {
    return {
      id: Number(c.id),
      name: c.name,
      city: (c.city ?? '').toString(),
      status: 'active',
      teams: typeof c.teamsCount === 'number' ? c.teamsCount : 0,
    };
  }

  load(): void {
    this.loading = true;
    this.api.list().subscribe({
      next: (items) => {
        this.loading = false;
        this.clubs = (items ?? []).map((c) => this.toUiClub(c));
      },
      error: (e: unknown) => {
        this.loading = false;
        const msg = e instanceof Error ? e.message : 'No se pudieron cargar los clubes.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  get filteredClubs() {
    const q = this.filters.search.trim().toLowerCase();
    return this.clubs.filter((c) => {
      const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
      const matchesStatus = this.filters.status === 'all' || c.status === this.filters.status;
      return matchesQuery && matchesStatus;
    });
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

  openEdit(item: (typeof this.clubs)[number]): void {
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

    const payload = { name, city: this.draft.city.trim() || null };

    if (this.dialogMode === 'create') {
      this.api.create(payload).subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'Ok', detail: 'Club creado.' });
          this.closeDialog();
          this.load();
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
        this.load();
      },
      error: (e: unknown) => {
        const msg = e instanceof Error ? e.message : 'No se pudo actualizar el club.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
