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
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

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

  private readonly refresh$ = new BehaviorSubject<void>(undefined);
  private readonly loading$ = new BehaviorSubject<boolean>(true);

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

  items$ = this.refresh$.pipe(
    switchMap(() => {
      this.loading$.next(true);
      return this.api.list({ search: this.filters.search || undefined }).pipe(
        map((items) => (items ?? []).map((e) => this.toUiItem(e))),
        catchError((e: unknown) => {
          const msg = e instanceof Error ? e.message : 'No se pudo cargar el material.';
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
          return of([] as Array<{ id: number; name: string; category: string; total: number; available: number }>);
        }),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  vm$ = combineLatest([this.items$, this.loading$.pipe(startWith(true))]).pipe(
    map(([items, loading]) => {
      const q = this.filters.search.trim().toLowerCase();
      const filtered = items.filter((i) => {
        const matchesQuery = !q || i.name.toLowerCase().includes(q);
        const matchesCat = this.filters.category === 'all' || i.category === this.filters.category;
        const status = this.stockStatus(i);
        const matchesStatus = this.filters.status === 'all' || status === this.filters.status;
        return matchesQuery && matchesCat && matchesStatus;
      });
      return { items, filtered, loading: Boolean(loading) };
    }),
    startWith({ items: [], filtered: [], loading: true as const }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

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
    this.refresh();
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

  refresh(): void {
    this.refresh$.next();
  }

  stockStatus(item: { id: number; name: string; category: string; total: number; available: number }): 'available' | 'low' | 'out' {
    if (item.available <= 0) return 'out';
    if (item.available <= Math.max(1, Math.round(item.total * 0.25))) return 'low';
    return 'available';
  }

  stockTag(item: { id: number; name: string; category: string; total: number; available: number }) {
    const status = this.stockStatus(item);
    if (status === 'available') return { label: 'Disponible', severity: 'success' as const };
    if (status === 'low') return { label: 'Bajo stock', severity: 'warn' as const };
    return { label: 'Agotado', severity: 'danger' as const };
  }

  clearFilters(): void {
    this.filters.search = '';
    this.filters.category = 'all';
    this.filters.status = 'all';
    this.refresh();
  }

  openCreate(): void {
    this.dialogMode = 'create';
    this.draft = { id: 0, name: '', category: 'Balones', total: 0, available: 0 };
    this.materialDialogVisible = true;
  }

  openEdit(item: { id: number; name: string; category: string; total: number; available: number }): void {
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
          this.refresh();
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
        this.refresh();
      },
      error: (e: unknown) => {
        const msg = e instanceof Error ? e.message : 'No se pudo actualizar el material.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
