import { Component, inject } from '@angular/core';
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
import { EquipmentApi, EquipmentDto } from '../services/equipment.api';
import { ClubContextService } from '../core/context/club-context.service';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-material',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ToastModule,
    PageHeader,
    BpDialog,
		AppShell,
  ],
  providers: [MessageService],
  templateUrl: './material.html',
  styleUrl: './material.scss',
})
export class Material {
  private readonly api = inject(EquipmentApi);
  private readonly toast = inject(MessageService);
  private readonly clubContext = inject(ClubContextService);

  private readonly refresh$ = new BehaviorSubject<void>(undefined);
  private readonly loading$ = new BehaviorSubject<boolean>(true);

  categoryOptions = [
    { label: 'Todas', value: 'all' },
    { label: 'Balones', value: 'Balones' },
    { label: 'Conos y marcadores', value: 'Conos' },
    { label: 'Petos y camisetas', value: 'Petos' },
    { label: 'Aros y canastas', value: 'Aros' },
    { label: 'Escaleras y vallas', value: 'Agilidad' },
    { label: 'Bandas elásticas', value: 'Bandas' },
    { label: 'Colchonetas', value: 'Colchonetas' },
    { label: 'Pizarras tácticas', value: 'Pizarras' },
    { label: 'Cronómetros', value: 'Cronometros' },
    { label: 'Otros', value: 'Otros' },
  ];

  categoryOptionsWithoutAll = this.categoryOptions.filter((opt) => opt.value !== 'all');

  statusOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Disponible', value: 'available' },
    { label: 'Mantenimiento', value: 'maintenance' },
    { label: 'No disponible', value: 'unavailable' },
  ];

  filters = {
    search: '',
    category: 'all',
    status: 'all',
  };

  items$ = combineLatest([
    this.refresh$,
    this.clubContext.selectedClubId$,
  ]).pipe(
    switchMap(([, clubId]) => {
      this.loading$.next(true);
      return this.api.list({ 
        search: this.filters.search || undefined,
        clubId: clubId ? String(clubId) : undefined,
      }).pipe(
        map((items) => (items ?? []).map((e) => this.toUiItem(e))),
        catchError((e: unknown) => {
          const msg = e instanceof Error ? e.message : 'No se pudo cargar el material.';
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
          return of([] as Array<{ id: number; name: string; category: string; status: string }>);
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
        const matchesStatus = this.filters.status === 'all' || i.status === this.filters.status;
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
    status: 'available' as 'available' | 'unavailable' | 'maintenance',
  };

  constructor() {
    this.refresh();
  }

  private toUiItem(e: EquipmentDto): { id: number; name: string; category: string; status: string } {
    return {
      id: Number(e.id),
      name: e.name,
      category: (e.characteristics as any)?.category ? String((e.characteristics as any).category) : 'Otros',
      status: e.status || 'available',
    };
  }

  private toPayload(draft: typeof this.draft): Partial<EquipmentDto> {
    const payload: Partial<EquipmentDto> = {
      name: draft.name.trim(),
      status: draft.status,
      characteristics: { category: draft.category },
    };
    // RF024/CU-020: Associate material with the selected club
    const clubId = this.clubContext.getSelectedClubIdSnapshot();
    if (clubId) {
      payload.clubId = clubId;
    }
    return payload;
  }

  refresh(): void {
    this.refresh$.next();
  }

  statusTag(item: { id: number; name: string; category: string; status: string }) {
    if (item.status === 'available') return { label: 'Disponible', severity: 'success' as const };
    if (item.status === 'maintenance') return { label: 'Mantenimiento', severity: 'warn' as const };
    return { label: 'No disponible', severity: 'danger' as const };
  }

  clearFilters(): void {
    this.filters.search = '';
    this.filters.category = 'all';
    this.filters.status = 'all';
    this.refresh();
  }

  openCreate(): void {
    this.dialogMode = 'create';
    this.draft = { id: 0, name: '', category: 'Balones', status: 'available' };
    this.materialDialogVisible = true;
  }

  openEdit(item: { id: number; name: string; category: string; status: string }): void {
    this.dialogMode = 'edit';
    this.draft = { 
      id: item.id, 
      name: item.name, 
      category: item.category, 
      status: (item.status === 'available' || item.status === 'maintenance' || item.status === 'unavailable') 
        ? item.status 
        : 'available'
    };
    this.materialDialogVisible = true;
  }

  closeDialog(): void {
    this.materialDialogVisible = false;
  }

  saveDialog(): void {
    const name = this.draft.name.trim();
    if (!name) return;

    const payload = this.toPayload(this.draft);

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

  deleteDialog(): void {
    if (!this.draft.id) return;

    if (!confirm('¿Estás seguro de que quieres eliminar este material? Esta acción no se puede deshacer.')) {
      return;
    }

    this.api.remove(this.draft.id).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Ok', detail: 'Material eliminado.' });
        this.closeDialog();
        this.refresh();
      },
      error: (e: unknown) => {
        const msg = e instanceof Error ? e.message : 'No se pudo eliminar el material.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
