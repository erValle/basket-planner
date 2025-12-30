import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { InputNumberModule } from 'primeng/inputnumber';

import { PageHeader } from '../components/page-header/page-header';
import { AppShell } from '../layout/app-shell/app-shell';

@Component({
  selector: 'app-material',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TagModule,
    InputNumberModule,
    PageHeader,
		AppShell,
  ],
  templateUrl: './material.html',
  styleUrl: './material.css',
})
export class Material {
  teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam = this.teamsTop[0];

  categoryOptions = [
    { label: 'Todas', value: 'all' },
    { label: 'Balones', value: 'Balones' },
    { label: 'Conos', value: 'Conos' },
    { label: 'Petos', value: 'Petos' },
    { label: 'Otros', value: 'Otros' },
  ];

  categoryOptionsWithoutAll = this.categoryOptions.filter((opt) => opt.value !== 'all');

  statusOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Disponible', value: 'available' },
    { label: 'Bajo stock', value: 'low' },
    { label: 'Agotado', value: 'out' },
  ];

  filters = {
    search: '',
    category: 'all',
    status: 'all',
  };

  items = [
    { id: 'm1', name: 'Balón talla 7', category: 'Balones', total: 12, available: 10 },
    { id: 'm2', name: 'Conos entrenamiento', category: 'Conos', total: 30, available: 6 },
    { id: 'm3', name: 'Petos (varios colores)', category: 'Petos', total: 20, available: 0 },
    { id: 'm4', name: 'Escalera coordinación', category: 'Otros', total: 3, available: 3 },
  ];

  materialDialogVisible = false;
  dialogMode: 'create' | 'edit' = 'create';

  draft = {
    id: '',
    name: '',
    category: 'Balones',
    total: 0,
    available: 0,
  };

  get filteredItems() {
    const q = this.filters.search.trim().toLowerCase();
    return this.items.filter((i) => {
      const matchesQuery = !q || i.name.toLowerCase().includes(q);
      const matchesCat = this.filters.category === 'all' || i.category === this.filters.category;
      const status = this.stockStatus(i);
      const matchesStatus = this.filters.status === 'all' || status === this.filters.status;
      return matchesQuery && matchesCat && matchesStatus;
    });
  }

  stockStatus(item: (typeof this.items)[number]): 'available' | 'low' | 'out' {
    if (item.available <= 0) return 'out';
    if (item.available <= Math.max(1, Math.round(item.total * 0.25))) return 'low';
    return 'available';
  }

  stockTag(item: (typeof this.items)[number]) {
    const status = this.stockStatus(item);
    if (status === 'available') return { label: 'Disponible', severity: 'success' as const };
    if (status === 'low') return { label: 'Bajo stock', severity: 'warn' as const };
    return { label: 'Agotado', severity: 'danger' as const };
  }

  clearFilters(): void {
    this.filters.search = '';
    this.filters.category = 'all';
    this.filters.status = 'all';
  }

  openCreate(): void {
    this.dialogMode = 'create';
    this.draft = { id: '', name: '', category: 'Balones', total: 0, available: 0 };
    this.materialDialogVisible = true;
  }

  openEdit(item: (typeof this.items)[number]): void {
    this.dialogMode = 'edit';
    this.draft = { ...item };
    this.materialDialogVisible = true;
  }

  closeDialog(): void {
    this.materialDialogVisible = false;
  }

  saveDialog(): void {
    const name = this.draft.name.trim();
    if (!name) return;

    const total = Math.max(0, Number(this.draft.total) || 0);
    const available = Math.min(total, Math.max(0, Number(this.draft.available) || 0));

    if (this.dialogMode === 'create') {
      this.items = [{ ...this.draft, id: `m${Date.now()}`, name, total, available }, ...this.items];
    } else {
      this.items = this.items.map((i) => (i.id === this.draft.id ? { ...this.draft, name, total, available } : i));
    }

    this.closeDialog();
  }
}
