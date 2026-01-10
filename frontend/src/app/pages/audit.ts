import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';
import { BpDialog } from '../components/bp-dialog/bp-dialog';

import { AuditApiService } from '../services/audit.api';
import { AuditAction, AuditLogDetail, AuditLogListItem } from '../models/audit';

type Option = { label: string; value: string };

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
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
  ],
  templateUrl: './audit.html',
  styleUrl: './audit.css',
  providers: [MessageService],
})
export class AuditPage {
  loading = false;
  loadError: string | null = null;

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
    { label: 'Usuarios', value: 'users' },
    { label: 'Planificaciones', value: 'plannings' },
    { label: 'Sesiones', value: 'sessions' },
    { label: 'Feedback', value: 'feedback' },
    { label: 'Equipamiento', value: 'equipment' },
    { label: 'Otros', value: 'other' },
  ];

  actionOptions: Option[] = [
    { label: 'Todas', value: '' },
    { label: 'CREATE', value: 'CREATE' },
    { label: 'UPDATE', value: 'UPDATE' },
    { label: 'DELETE', value: 'DELETE' },
    { label: 'LOGIN', value: 'LOGIN' },
    { label: 'LOGOUT', value: 'LOGOUT' },
    { label: 'EXPORT', value: 'EXPORT' },
    { label: 'EMAIL', value: 'EMAIL' },
    { label: 'ASSIGN', value: 'ASSIGN' },
    { label: 'OTHER', value: 'OTHER' },
  ];

  items: AuditLogListItem[] = [];

  detailDialogOpen = false;
  detailLoading = false;
  detailError: string | null = null;
  selected: AuditLogDetail | null = null;

  constructor(private readonly api: AuditApiService, private readonly toast: MessageService) {}

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
    this.loading = true;
    this.loadError = null;

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
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.items = (res?.items && Array.isArray(res.items) ? res.items : []).slice();
        },
        error: (e: unknown) => {
          this.loading = false;
          this.loadError = e instanceof Error ? e.message : 'No se pudo cargar el audit log.';
          this.toast.add({ severity: 'error', summary: 'Error', detail: this.loadError });
        },
      });
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

  actionSeverity(a: AuditAction): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (a) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'info';
      case 'DELETE':
        return 'danger';
      case 'LOGIN':
      case 'LOGOUT':
        return 'secondary';
      case 'EXPORT':
      case 'EMAIL':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  openDetail(row: AuditLogListItem): void {
    this.detailDialogOpen = true;
    this.detailLoading = true;
    this.detailError = null;

    this.api.get(row.id).subscribe({
      next: (res) => {
        this.detailLoading = false;
        if (res?.item) this.selected = res.item;
      },
      error: (e: unknown) => {
        this.detailLoading = false;
        this.detailError = e instanceof Error ? e.message : 'No se pudo cargar el detalle.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: this.detailError });
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
}
