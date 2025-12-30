import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';

import { PlanningApiService } from '../services/planning.api';
import { PlanningExportEmailPayload, PlanningExportFormat, PlanningListItem, PlanningStatus } from '../models/planning';

type Option = { label: string; value: string };

@Component({
  selector: 'app-planning',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    SelectModule,
  DatePickerModule,
    TableModule,
    TagModule,
    MenuModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    DialogModule,
    TextareaModule,
    PageHeader,
    AppShell,
  ],
  templateUrl: './planning.html',
  styleUrl: './planning.css',
  providers: [MessageService, ConfirmationService],
})
export class Planning {
  teamsTop: string[] = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam: string = this.teamsTop[0];

  clubOptions: Option[] = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Club Ficticio', value: 'Club Ficticio' },
  ];

  teamOptions: Option[] = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Senior Masculino', value: 'Senior Masculino' },
    { label: 'U18 A', value: 'U18 A' },
  ];

  statusOptions: Array<{ label: string; value: PlanningStatus | 'all' }> = [
    { label: 'Todos', value: 'all' },
    { label: 'Borrador', value: 'draft' },
    { label: 'Generada', value: 'generated' },
    { label: 'Publicada', value: 'published' },
    { label: 'Archivada', value: 'archived' },
  ];

  filters = {
    club: 'Todos',
    team: 'Todos',
    status: 'all' as PlanningStatus | 'all',
    search: '',
    dateRange: null as Date[] | null,
  };

  loading = false;
  loadError: string | null = null;

  rows = 10;
  first = 0;

  plannings: PlanningListItem[] = [
    {
      id: 'pl-1001',
      date: '2025-12-29',
      team: 'Senior Masculino',
      objective: 'Mejora del tiro exterior',
      status: 'generated',
      version: 'v3',
      author: 'P. Valle',
    },
    {
      id: 'pl-1002',
      date: '2025-12-27',
      team: 'U18 A',
      objective: 'Defensa individual',
      status: 'draft',
      version: 'v1',
      author: 'P. Valle',
    },
    {
      id: 'pl-1003',
      date: '2025-12-22',
      team: 'Senior Masculino',
      objective: 'Condición física',
      status: 'published',
      version: 'v2',
      author: 'Staff',
    },
  ];

  // Export menu per row
  exportMenuVisibleForId: string | null = null;
  exportMenuItems: MenuItem[] = [];

  downloadingForId: string | null = null;
  downloadingFormat: 'pdf' | 'csv' | null = null;

  // Email dialog
  sendDialogOpen = false;
  sendingEmail = false;
  sendPlanningId: string | null = null;
  sendPlanningVersion: string | undefined;
  recipientDraft = '';
  emailModel: PlanningExportEmailPayload = {
    recipients: [],
    subject: '',
    message: '',
    format: 'pdf',
    version: undefined,
  };

  formatOptions: Array<{ label: string; value: PlanningExportFormat }> = [
    { label: 'PDF', value: 'pdf' },
    { label: 'CSV', value: 'csv' },
  ];

  constructor(
    private readonly api: PlanningApiService,
    private readonly router: Router,
    private readonly toast: MessageService,
    private readonly confirmation: ConfirmationService,
  ) {
    this.exportMenuItems = [
      {
        label: 'Exportar PDF',
        icon: 'pi pi-file-pdf',
        command: () => this.exportCurrent('pdf'),
      },
      {
        label: 'Exportar CSV',
        icon: 'pi pi-file',
        command: () => this.exportCurrent('csv'),
      },
      {
        separator: true,
      },
      {
        label: 'Enviar por correo',
        icon: 'pi pi-envelope',
        command: () => this.openSendDialogForCurrent(),
      },
    ];
  }

  ngOnInit(): void {
    this.load();
  }

  clearFilters(): void {
    this.filters = { club: 'Todos', team: 'Todos', status: 'all', search: '', dateRange: null };
    this.first = 0;
    this.load();
  }

  private toIsoDate(d: Date): string {
    // Avoid timezone surprises: keep date only.
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  load(): void {
    this.loading = true;
    this.loadError = null;

    const from = this.filters.dateRange?.[0] ? this.toIsoDate(this.filters.dateRange[0]) : undefined;
    const to = this.filters.dateRange?.[1] ? this.toIsoDate(this.filters.dateRange[1]) : undefined;

    this.api
      .list({
        club: this.filters.club === 'Todos' ? undefined : this.filters.club,
        team: this.filters.team === 'Todos' ? undefined : this.filters.team,
        status: this.filters.status === 'all' ? undefined : this.filters.status,
        search: this.filters.search || undefined,
        from,
        to,
        page: Math.floor(this.first / this.rows) + 1,
        pageSize: this.rows,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;

          // If backend is not ready yet, keep local mock data (do not break UX).
          if (res?.items && Array.isArray(res.items)) {
            this.plannings = res.items;
          }
        },
        error: (e: unknown) => {
          this.loading = false;
          const msg = e instanceof Error ? e.message : 'No se pudieron cargar las planificaciones.';
          this.loadError = msg;
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
  }

  // Derived UI view
  get filteredPlannings(): PlanningListItem[] {
    // Keep a client-side filter fallback so the screen works even without backend filtering.
    const search = this.filters.search.trim().toLowerCase();

    return this.plannings.filter((p) => {
      if (this.filters.team !== 'Todos' && p.team !== this.filters.team) return false;
      if (this.filters.status !== 'all' && p.status !== this.filters.status) return false;

      if (this.filters.dateRange?.[0]) {
        const from = this.toIsoDate(this.filters.dateRange[0]);
        if (p.date < from) return false;
      }
      if (this.filters.dateRange?.[1]) {
        const to = this.toIsoDate(this.filters.dateRange[1]);
        if (p.date > to) return false;
      }

      if (search) {
        const haystack = `${p.team} ${p.objective} ${p.author} ${p.version} ${p.status}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      return true;
    });
  }

  onPageChange(e: any): void {
    this.first = e?.first ?? 0;
    this.rows = e?.rows ?? this.rows;
    this.load();
  }

  statusLabel(s: PlanningStatus): string {
    switch (s) {
      case 'draft':
        return 'Borrador';
      case 'generated':
        return 'Generada';
      case 'published':
        return 'Publicada';
      case 'archived':
        return 'Archivada';
    }
  }

  statusSeverity(s: PlanningStatus): 'success' | 'info' | 'warn' | 'danger' {
    switch (s) {
      case 'draft':
        return 'warn';
      case 'generated':
        return 'info';
      case 'published':
        return 'success';
      case 'archived':
        return 'danger';
    }
  }

  openNew(): void {
    this.router.navigate(['/planning/new']);
  }

  view(item: PlanningListItem): void {
    this.router.navigate(['/planning', item.id]);
  }

  editAsNewVersion(item: PlanningListItem): void {
    this.router.navigate(['/planning', item.id, 'edit']);
  }

  openExportMenuFor(item: PlanningListItem): void {
    this.exportMenuVisibleForId = item.id;
  }

  openSendDialogForCurrent(): void {
    if (!this.exportMenuVisibleForId) return;
    const id = this.exportMenuVisibleForId;
    this.exportMenuVisibleForId = null;

    const version = this.plannings.find((p) => p.id === id)?.version;
    this.sendPlanningId = id;
    this.sendPlanningVersion = version;
    this.recipientDraft = '';
    this.emailModel = {
      recipients: [],
      subject: `Planificación ${id} (${version ?? 'última'})`,
      message: '',
      format: 'pdf',
      version: version ?? undefined,
    };

    this.sendDialogOpen = true;
  }

  addRecipient(): void {
    const v = this.recipientDraft.trim();
    if (!v) return;
    if (this.emailModel.recipients.includes(v)) {
      this.recipientDraft = '';
      return;
    }
    this.emailModel.recipients = [...this.emailModel.recipients, v];
    this.recipientDraft = '';
  }

  removeRecipient(v: string): void {
    this.emailModel.recipients = this.emailModel.recipients.filter((r) => r !== v);
  }

  canSendEmail(): boolean {
    return (
      !!this.sendPlanningId &&
      this.emailModel.recipients.length > 0 &&
      this.emailModel.subject.trim().length > 0
    );
  }

  sendEmail(): void {
    if (!this.sendPlanningId) return;
    if (!this.canSendEmail()) {
      this.toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'Añade destinatarios y asunto.' });
      return;
    }

    this.sendingEmail = true;
    const payload: PlanningExportEmailPayload = {
      recipients: this.emailModel.recipients,
      subject: this.emailModel.subject,
      message: this.emailModel.message || undefined,
      format: this.emailModel.format,
      version: this.emailModel.version || undefined,
    };

    this.api.sendExportEmail(this.sendPlanningId, payload).subscribe({
      next: () => {
        this.sendingEmail = false;
        this.sendDialogOpen = false;
        this.toast.add({ severity: 'success', summary: 'Enviado', detail: 'Exportación enviada por correo (stub).' });
      },
      error: (e: unknown) => {
        this.sendingEmail = false;
        const msg = e instanceof Error ? e.message : 'No se pudo enviar el correo.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  exportCurrent(format: 'pdf' | 'csv'): void {
    if (!this.exportMenuVisibleForId) return;
    const id = this.exportMenuVisibleForId;
    this.exportMenuVisibleForId = null;

    this.downloadingForId = id;
    this.downloadingFormat = format;
    this.toast.add({ severity: 'info', summary: 'Exportación', detail: `Descargando ${format.toUpperCase()}…` });

    const version = this.plannings.find((p) => p.id === id)?.version;
    const req$ = format === 'pdf' ? this.api.exportPdf(id, version) : this.api.exportCsv(id, version);
    const filename = `planning-${id}-${version ?? 'latest'}.${format}`;

    req$.subscribe({
      next: (blob) => {
        this.downloadingForId = null;
        this.downloadingFormat = null;
        this.downloadBlob(blob, filename);
      },
      error: (e: unknown) => {
        this.downloadingForId = null;
        this.downloadingFormat = null;
        const msg = e instanceof Error ? e.message : `No se pudo exportar ${format.toUpperCase()}.`;
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.add({ severity: 'success', summary: 'Exportación', detail: `Descarga iniciada: ${filename}` });
  }

  confirmDelete(item: PlanningListItem): void {
    this.confirmation.confirm({
      header: 'Eliminar planificación',
      message: `¿Quieres eliminar la planificación ${item.id}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => this.deleteLocal(item),
    });
  }

  private deleteLocal(item: PlanningListItem): void {
    // Stub: only remove locally for now.
    this.plannings = this.plannings.filter((p) => p.id !== item.id);
    this.toast.add({ severity: 'success', summary: 'Eliminada', detail: 'Planificación eliminada (stub).' });
  }
}
