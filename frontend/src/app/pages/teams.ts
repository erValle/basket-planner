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
import { AppShell } from '../layout/app-shell/app-shell';

@Component({
  selector: 'app-teams',
	imports: [CommonModule, FormsModule, RouterLink, ButtonModule, DialogModule, InputTextModule, SelectModule, TagModule, PageHeader, AppShell],
  templateUrl: './teams.html',
  styleUrl: './teams.css',
})
export class Teams {
  teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam = this.teamsTop[0];

  clubOptions = [
    { label: 'Club Ficticio', value: 'Club Ficticio' },
    { label: 'Basket Norte', value: 'Basket Norte' },
    { label: 'Academia Sur', value: 'Academia Sur' },
  ];

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

  teams = [
    { id: 't1', name: 'Senior Masculino', club: 'Club Ficticio', category: 'Senior', status: 'active' as const, players: 14 },
    { id: 't2', name: 'Senior Femenino', club: 'Club Ficticio', category: 'Senior', status: 'active' as const, players: 12 },
    { id: 't3', name: 'Junior', club: 'Basket Norte', category: 'Junior', status: 'active' as const, players: 16 },
    { id: 't4', name: 'Juvenil', club: 'Academia Sur', category: 'Juvenil', status: 'inactive' as const, players: 0 },
  ];

  teamDialogVisible = false;
  dialogMode: 'create' | 'edit' = 'create';

  draft = {
    id: '',
    name: '',
    club: 'Club Ficticio',
    category: 'Senior',
    status: 'active' as 'active' | 'inactive',
    players: 0,
  };

  get filteredTeams() {
    const q = this.filters.search.trim().toLowerCase();
    return this.teams.filter((t) => {
      const matchesQuery = !q || t.name.toLowerCase().includes(q);
      const matchesClub = this.filters.club === 'all' || t.club === this.filters.club;
      const matchesCat = this.filters.category === 'all' || t.category === this.filters.category;
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
      id: '',
      name: '',
      club: 'Club Ficticio',
      category: 'Senior',
      status: 'active',
      players: 0,
    };
    this.teamDialogVisible = true;
  }

  openEdit(item: (typeof this.teams)[number]): void {
    this.dialogMode = 'edit';
    this.draft = { ...item };
    this.teamDialogVisible = true;
  }

  closeDialog(): void {
    this.teamDialogVisible = false;
  }

  saveDialog(): void {
    const name = this.draft.name.trim();
    if (!name) return;

    if (this.dialogMode === 'create') {
      this.teams = [
        { ...this.draft, id: `t${Date.now()}`, name, players: Number(this.draft.players) || 0 },
        ...this.teams,
      ];
    } else {
      this.teams = this.teams.map((t) => (t.id === this.draft.id ? { ...this.draft, name } : t));
    }

    this.closeDialog();
  }
}
