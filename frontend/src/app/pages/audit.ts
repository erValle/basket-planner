import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { BehaviorSubject, switchMap, map, catchError, of, startWith, shareReplay } from 'rxjs';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';
import { BpDialog } from '../components/bp-dialog/bp-dialog';

import { AuditApiService } from '../services/audit.api';
import { AuditAction, AuditLogDetail, AuditLogListItem } from '../models/audit';

type Option = { label: string; value: string };

interface AuditVm {
  loading: boolean;
  error: string | null;
  items: AuditLogListItem[];
}

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    TableModule,
    BpDialog,
    TagModule,
    ToastModule,
    ProgressSpinnerModule,
    InputTextModule,
    DatePickerModule,
    PageHeader,
    AppShell,
    ConfirmDialogModule,
  ],
  templateUrl: './audit.html',
  styleUrl: './audit.scss',
  providers: [MessageService, ConfirmationService],
})
export class AuditPage {
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  rows = 20;
  first = 0;

  filters = {
    entity: '',
    action: '' as AuditAction | '',
    user: '',
    entityId: '',
    requestId: '',
    from: null as Date | null,
    to: null as Date | null,
  };

  entityOptions: Option[] = [
    { label: 'Todas', value: '' },
    { label: 'HttpRequest', value: 'HttpRequest' },
    { label: 'TrainingPlan', value: 'TrainingPlan' },
    { label: 'TrainingPlanVersion', value: 'TrainingPlanVersion' },
    { label: 'User', value: 'User' },
    { label: 'ENDPOINT', value: 'ENDPOINT' },
    { label: 'PERMISSION', value: 'PERMISSION' },
    { label: 'SCOPE_CHECK', value: 'SCOPE_CHECK' },
  ];

  actionOptions: Option[] = [
    { label: 'Todas', value: '' },
    { label: 'http_request.success', value: 'http_request.success' },
    { label: 'http_request.error', value: 'http_request.error' },
    { label: 'training_plan.create', value: 'training_plan.create' },
    { label: 'training_plan.update', value: 'training_plan.update' },
    { label: 'training_plan_version.create', value: 'training_plan_version.create' },
    { label: 'training_plan_version.activate', value: 'training_plan_version.activate' },
    { label: 'user.create', value: 'user.create' },
    { label: 'user.update', value: 'user.update' },
    { label: 'UNAUTHORIZED_ACCESS_ATTEMPT', value: 'UNAUTHORIZED_ACCESS_ATTEMPT' },
    { label: 'UNAUTHORIZED_SCOPE_ACCESS', value: 'UNAUTHORIZED_SCOPE_ACCESS' },
  ];

  vm$ = this.refresh$.pipe(
    switchMap(() =>
      this.api
        .list({
          entity: this.filters.entity || undefined,
          action: this.filters.action || undefined,
          userId: this.filters.user ? Number(this.filters.user) : undefined,
          entityId: this.filters.entityId || undefined,
          requestId: this.filters.requestId || undefined,
          from: this.toIsoDate(this.filters.from),
          to: this.toIsoDate(this.filters.to),
          limit: 200,
        })
        .pipe(
          map((res) => {
            const items = (res?.items && Array.isArray(res.items) ? res.items : []).slice();
            return { loading: false, error: null, items } as AuditVm;
          }),
          startWith({ loading: true, error: null, items: [] } as AuditVm),
          catchError((e: unknown) => {
            const error = e instanceof Error ? e.message : 'No se pudo cargar el audit log.';
            this.toast.add({ severity: 'error', summary: 'Error', detail: error });
            return of({ loading: false, error, items: [] } as AuditVm);
          }),
        ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  detailDialogOpen = false;
  detailLoading = false;
  detailError: string | null = null;
  selected: AuditLogDetail | null = null;

  constructor(
    private readonly api: AuditApiService,
    private readonly toast: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private toIsoDate(d: Date | null): string | undefined {
    if (!d) return undefined;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  load(): void {
    this.refresh$.next();
  }

  clearFilters(): void {
    this.filters = { entity: '', action: '', user: '', entityId: '', requestId: '', from: null, to: null };
    this.first = 0;
    this.load();
  }

  onPageChange(e: any): void {
    this.first = e.first ?? 0;
    this.rows = e.rows ?? this.rows;
  }

  actionSeverity(a: AuditAction | string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (a.includes('create') || a === 'http_request.success') return 'success';
    if (a.includes('update') || a.includes('activate')) return 'info';
    if (a.includes('delete')) return 'danger';
    if (a.includes('UNAUTHORIZED') || a === 'http_request.error') return 'warn';
    return 'secondary';
  }

  openDetail(row: AuditLogListItem): void {
    this.zone.run(() => {
      this.detailDialogOpen = true;
      this.detailLoading = true;
      this.detailError = null;
      this.cdr.detectChanges();
    });

    this.api.get(row.id).subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.detailLoading = false;
          if (res?.item) this.selected = res.item;
          this.cdr.detectChanges();
        });
      },
      error: (e: unknown) => {
        this.zone.run(() => {
          this.detailLoading = false;
          this.detailError = e instanceof Error ? e.message : 'No se pudo cargar el detalle.';
          this.toast.add({ severity: 'error', summary: 'Error', detail: this.detailError });
          this.cdr.detectChanges();
        });
      },
    });
  }

  prettyJson(v: unknown): string {
    try {
      return JSON.stringify(v ?? null, null, 2);
    } catch {
      return String(v);
    }
  }

  exportCsv(): void {
    this.api.exportCsv({
      entity: this.filters.entity || undefined,
      action: this.filters.action || undefined,
      userId: this.filters.user ? Number(this.filters.user) : undefined,
      entityId: this.filters.entityId || undefined,
      requestId: this.filters.requestId || undefined,
      from: this.toIsoDate(this.filters.from),
      to: this.toIsoDate(this.filters.to),
    }).subscribe({
      next: (csv) => {
        const blob = new Blob([csv as string], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.add({ severity: 'success', summary: 'Éxito', detail: 'CSV exportado correctamente' });
      },
      error: (e: unknown) => {
        const error = e instanceof Error ? e.message : 'No se pudo exportar el CSV.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: error });
      },
    });
  }

  confirmDeleteAll(): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que quieres eliminar TODOS los registros de auditoría? Esta acción no se puede deshacer.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar todos',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'bp-btn bp-btn-danger',
      rejectButtonStyleClass: 'bp-btn bp-btn-ghost',
      accept: () => {
        this.deleteAll();
      },
    });
  }

  deleteAll(): void {
    this.api.deleteAll().subscribe({
      next: (result) => {
        this.toast.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: `${result.deleted} registros eliminados` 
        });
        this.load();
      },
      error: (e: unknown) => {
        const error = e instanceof Error ? e.message : 'No se pudieron eliminar los logs.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: error });
      },
    });
  }
}
