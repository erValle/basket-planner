import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

import { PageHeader } from '../components/page-header/page-header';

@Component({
  selector: 'app-clubs',
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, DialogModule, InputTextModule, SelectModule, TagModule, PageHeader],
  templateUrl: './clubs.html',
  styleUrl: './clubs.css',
})
export class Clubs {
  teams = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam = this.teams[0];

  filters = {
    search: '',
    status: 'all' as 'all' | 'active' | 'inactive',
  };

  statusOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' },
  ];

  clubs = [
    { id: 'c1', name: 'Club Ficticio', city: 'Valencia', status: 'active' as const, teams: 6 },
    { id: 'c2', name: 'Basket Norte', city: 'Castellón', status: 'active' as const, teams: 4 },
    { id: 'c3', name: 'Academia Sur', city: 'Alicante', status: 'inactive' as const, teams: 2 },
  ];

  clubDialogVisible = false;
  dialogMode: 'create' | 'edit' = 'create';

  draft = {
    id: '',
    name: '',
    city: '',
    status: 'active' as 'active' | 'inactive',
    teams: 0,
  };

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
    this.draft = { id: '', name: '', city: '', status: 'active', teams: 0 };
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

    if (this.dialogMode === 'create') {
      this.clubs = [
        { ...this.draft, id: `c${Date.now()}`, name, city: this.draft.city.trim(), teams: Number(this.draft.teams) || 0 },
        ...this.clubs,
      ];
    } else {
      this.clubs = this.clubs.map((c) => (c.id === this.draft.id ? { ...this.draft, name, city: this.draft.city.trim() } : c));
    }

    this.closeDialog();
  }
}
