import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';

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
    DialogModule,
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
  teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam = this.teamsTop[0];

  loading = false;
  loadError: string | null = null;

  rows = 20;
  first = 0;

  filters = {
    entity: '',
    action: '' as AuditAction | '',
    user: '',
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
        user: this.filters.user || undefined,
        from: this.toIsoDate(this.filters.from),
        to: this.toIsoDate(this.filters.to),
        limit: 200,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res?.items && Array.isArray(res.items) && res.items.length) {
            this.items = res.items;
            return;
          }

          // Stub-safe fallback
          this.items = this.mockItems();
        },
        error: (e: unknown) => {
          this.loading = false;
          this.loadError = e instanceof Error ? e.message : 'No se pudo cargar el audit log.';
          this.toast.add({ severity: 'error', summary: 'Error', detail: this.loadError });
        },
      });
  }

  clearFilters(): void {
    this.filters = { entity: '', action: '', user: '', from: null, to: null };
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
    this.selected = null;

    this.api.get(row.id).subscribe({
      next: (res) => {
        this.detailLoading = false;
        if (res?.item) {
          this.selected = res.item;
          return;
        }
        this.selected = this.mockDetail(row);
      },
      error: (e: unknown) => {
        this.detailLoading = false;
        this.detailError = e instanceof Error ? e.message : 'No se pudo cargar el detalle.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: this.detailError });
      },
    });
  }

  private mockItems(): AuditLogListItem[] {
    const base = new Date();
    const iso = (d: Date) => d.toISOString();

    return [
      {
        id: 'a-1',
        createdAt: iso(new Date(base.getTime() - 2 * 3600_000)),
        action: 'UPDATE',
        entity: 'plannings',
        entityId: 'pl-12',
        summary: 'Se creó una nueva versión (v3) y se publicó.',
        actor: { id: 'u-1', name: 'Admin', email: 'admin@club.com' },
        metadata: { version: 'v3', team: 'Senior Masculino' },
      },
      {
        id: 'a-2',
        createdAt: iso(new Date(base.getTime() - 6 * 3600_000)),
        action: 'EXPORT',
        entity: 'plannings',
        entityId: 'pl-12',
        summary: 'Exportación PDF solicitada.',
        actor: { id: 'u-2', name: 'Staff', email: 'staff@club.com' },
        metadata: { format: 'pdf' },
      },
      {
        id: 'a-3',
        createdAt: iso(new Date(base.getTime() - 26 * 3600_000)),
        action: 'LOGIN',
        entity: 'auth',
        entityId: 'u-1',
        summary: 'Inicio de sesión.',
        actor: { id: 'u-1', name: 'Admin', email: 'admin@club.com' },
        metadata: { ip: '127.0.0.1' },
      },
      {
        id: 'a-4',
        createdAt: iso(new Date(base.getTime() - 2 * 86400_000)),
        action: 'CREATE',
        entity: 'users',
        entityId: 'u-9',
        summary: 'Creación de usuario.',
        actor: { id: 'u-1', name: 'Admin', email: 'admin@club.com' },
        metadata: { role: 'COACH' },
      },
    ];
  }

  private mockDetail(row: AuditLogListItem): AuditLogDetail {
    return {
      ...row,
      request: { example: true, entity: row.entity, entityId: row.entityId },
      response: { ok: true },
      diff: row.action === 'UPDATE' ? { before: { status: 'draft' }, after: { status: 'published' } } : undefined,
    };
  }

  prettyJson(v: unknown): string {
    try {
      return JSON.stringify(v ?? null, null, 2);
    } catch {
      return String(v);
    }
  }
}
