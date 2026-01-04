import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { PageHeader } from '../components/page-header/page-header';
import { AppShell } from '../layout/app-shell/app-shell';
import { EquipmentApi, EquipmentDto } from '../services/equipment.api';

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
    ToastModule,
    PageHeader,
		AppShell,
  ],
  providers: [MessageService],
  templateUrl: './material.html',
  styleUrl: './material.css',
})
export class Material {
  private readonly api = inject(EquipmentApi);
  private readonly toast = inject(MessageService);

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

  loading = false;
  items: Array<{ id: number; name: string; category: string; total: number; available: number }> = [];

  materialDialogVisible = false;
  dialogMode: 'create' | 'edit' = 'create';

  draft = {
    id: 0,
    name: '',
    category: 'Balones',
    total: 0,
    available: 0,
  };

  constructor() {
    this.load();
  }

  private toUiItem(e: EquipmentDto): { id: number; name: string; category: string; total: number; available: number } {
    // Nota: el backend equipa `quantity` + `status`, y no tiene categoría ni disponibles.
    // Para mantener la UI: total = quantity. available depende de status.
    const total = Math.max(0, Number(e.quantity) || 0);
    const available = e.status === 'unavailable' || e.status === 'maintenance' ? 0 : total;

    return {
      id: Number(e.id),
      name: e.name,
      category: (e.characteristics as any)?.category ? String((e.characteristics as any).category) : 'Otros',
      total,
      available,
    };
  }

  private toPayload(draft: typeof this.draft): Partial<EquipmentDto> {
    const total = Math.max(0, Number(draft.total) || 0);
    const available = Math.min(total, Math.max(0, Number(draft.available) || 0));
    const status: 'available' | 'unavailable' = available <= 0 ? 'unavailable' : 'available';
    return {
      name: draft.name.trim(),
      quantity: total,
      status,
      characteristics: { category: draft.category },
    } as any;
  }

  load(): void {
    this.loading = true;
    this.api.list({ search: this.filters.search || undefined }).subscribe({
      next: (items) => {
        this.loading = false;
        this.items = (items ?? []).map((e) => this.toUiItem(e));
      },
      error: (e: unknown) => {
        this.loading = false;
        const msg = e instanceof Error ? e.message : 'No se pudo cargar el material.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

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
    this.draft = { id: 0, name: '', category: 'Balones', total: 0, available: 0 };
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

    const payload = this.toPayload({ ...this.draft, name, total, available });

    if (this.dialogMode === 'create') {
      this.api.create(payload).subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'Ok', detail: 'Material creado.' });
          this.closeDialog();
          this.load();
        },
        error: (e: unknown) => {
          const msg = e instanceof Error ? e.message : 'No se pudo crear el material.';
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
      return;
    }

    this.api.update(this.draft.id, payload).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Ok', detail: 'Material actualizado.' });
        this.closeDialog();
        this.load();
      },
      error: (e: unknown) => {
        const msg = e instanceof Error ? e.message : 'No se pudo actualizar el material.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
