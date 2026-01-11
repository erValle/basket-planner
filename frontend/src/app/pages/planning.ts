import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';

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
import { TextareaModule } from 'primeng/textarea';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';
import { BpDialog } from '../components/bp-dialog';

import { PlanningApiService } from '../services/planning.api';
import { ClubContextService } from '../core/context/club-context.service';
import { ClubsApi, ClubDto } from '../services/clubs.api';
import { TeamsApi, TeamDto } from '../services/teams.api';
import { PlanningExportEmailPayload, PlanningExportFormat, PlanningListItem, PlanningStatus } from '../models/planning';

import { BehaviorSubject, combineLatest, map, shareReplay, startWith, switchMap, filter } from 'rxjs';

type Option = { label: string; value: string };

@Component({
  selector: 'app-planning',
  imports: [
    CommonModule,
    FormsModule,
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
    BpDialog,
    TextareaModule,
    PageHeader,
    AppShell,
  ],
  templateUrl: './planning.html',
  styleUrl: './planning.css',
  providers: [MessageService, ConfirmationService],
})
export class Planning {
  private readonly selectedClubId: number | null;

  clubs: ClubDto[] = [];
  teams: TeamDto[] = [];

  clubOptions: Option[] = [{ label: 'Todos', value: 'Todos' }];
  teamOptions: Option[] = [{ label: 'Todos', value: 'Todos' }];

  statusOptions: Array<{ label: string; value: PlanningStatus | 'all' }> = [
    { label: 'Todos', value: 'all' },
    { label: 'Borrador', value: 'draft' },
    { label: 'Activa', value: 'active' },
    { label: 'Archivada', value: 'archived' },
  ];

  filters = {
    club: 'Todos',
    team: 'Todos',
    status: 'all' as PlanningStatus | 'all',
    search: '',
    dateRange: null as Date[] | null,
  };

  // Backend list endpoint currently ignores club/team filters.
  filtersNotSupportedYet = true;

  private readonly refresh$ = new BehaviorSubject<void>(undefined);
  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly loadError$ = new BehaviorSubject<string | null>(null);

  rows = 10;
  first = 0;

  private readonly plannings$ = this.refresh$.pipe(
    switchMap(() => {
      this.loading$.next(true);
      this.loadError$.next(null);

      const from = this.filters.dateRange?.[0] ? this.toIsoDate(this.filters.dateRange[0]) : undefined;
      const to = this.filters.dateRange?.[1] ? this.toIsoDate(this.filters.dateRange[1]) : undefined;

      return this.api
        .list({
          // Keep sending params for forward-compat, but UI communicates that they are not applied yet.
          club: this.filters.club === 'Todos' ? undefined : this.filters.club,
          team: this.filters.team === 'Todos' ? undefined : this.filters.team,
          status: this.filters.status === 'all' ? undefined : this.filters.status,
          search: this.filters.search || undefined,
          from,
          to,
          page: Math.floor(this.first / this.rows) + 1,
          pageSize: this.rows,
        })
        .pipe(
          map((res: any) => {
            this.loading$.next(false);

            // Temporary mapping: backend currently exposes training plans.
            if (Array.isArray(res)) {
              this.bootstrappedFromBackend = true;
              const mapped = res.map((p: any) => ({
                id: String(p.id),
                date: (p?.createdAt ? String(p.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10)),
                team: p?.targetType === 'group' ? 'Equipo' : 'Individual',
                objective: p?.name ? String(p.name) : 'Plan',
                status: (['draft', 'active', 'archived'].includes(String(p?.status))
                  ? String(p.status)
                  : 'draft') as any,
                version: p?.activeVersion?.versionNumber != null 
                  ? `v${p.activeVersion.versionNumber}` 
                  : (p?.activeVersionId != null ? `v${p.activeVersionId}` : 'v1'),
                author: p?.createdById != null ? `user:${p.createdById}` : '-',
              })) as PlanningListItem[];
              
              return mapped;
            }

            return [] as PlanningListItem[];
          }),
        );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly vm$ = combineLatest({
    items: this.plannings$,
    loading: this.loading$.pipe(startWith(false)),
    error: this.loadError$.pipe(startWith(null)),
    tick: this.refresh$.pipe(startWith(undefined)),
  }).pipe(
    map(({ items, loading, error }) => {
      // Keep a client-side filter fallback so the screen works even when backend filtering is limited.
      const search = this.filters.search.trim().toLowerCase();
      const filtered = items.filter((p) => {
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

      return { items, filtered, loading, error };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private bootstrappedFromBackend = true;

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
    private readonly clubContext: ClubContextService,
    private readonly clubsApi: ClubsApi,
    private readonly teamsApi: TeamsApi,
    private readonly router: Router,
    private readonly toast: MessageService,
    private readonly confirmation: ConfirmationService,
  ) {
    this.selectedClubId = this.clubContext.getSelectedClubIdSnapshot();

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
    // Keep dropdown options aligned with the global club context.
    this.clubContext.selectedClubId$.subscribe((clubId) => {
      // Clubs/teams selectors are currently disabled for list filtering,
      // but we still want sensible options and defaults.
      if (clubId != null) this.filters.club = String(clubId);
      this.loadFilters();
    });

    this.loadFilters();
    this.refresh();

    // Refresh the list when navigating back to this page
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        filter((event) => event.url === '/planning' || event.url.startsWith('/planning?'))
      )
      .subscribe(() => {
        this.refresh();
      });
  }

  private loadFilters(): void {
    const clubId = this.clubContext.getSelectedClubIdSnapshot();

    this.clubsApi.list().subscribe({
      next: (items) => {
        this.clubs = items ?? [];

        // If a club is selected in the shell, keep the dropdown limited to that club.
        const scopedClubs = clubId != null ? this.clubs.filter((c) => Number(c.id) === Number(clubId)) : this.clubs;
        this.clubOptions = [{ label: 'Todos', value: 'Todos' }, ...scopedClubs.map((c) => ({ label: c.name, value: String(c.id) }))];
      },
      error: () => {
        // keep defaults
      },
    });

    this.teamsApi.list({ clubId: clubId != null ? String(clubId) : undefined }).subscribe({
      next: (items) => {
        this.teams = items ?? [];
        this.teamOptions = [
          { label: 'Todos', value: 'Todos' },
          ...this.teams.map((t) => ({ label: t.name, value: String(t.id) })),
        ];
      },
      error: () => {
        // keep defaults
      },
    });
  }

  clearFilters(): void {
    this.filters = { club: 'Todos', team: 'Todos', status: 'all', search: '', dateRange: null };
    this.first = 0;
    this.refresh();
  }

  private toIsoDate(d: Date): string {
    // Avoid timezone surprises: keep date only.
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  refresh(): void {
    this.refresh$.next();
  }

  onPageChange(e: any): void {
    this.first = e?.first ?? 0;
    this.rows = e?.rows ?? this.rows;
    this.refresh();
  }

  statusLabel(s: PlanningStatus): string {
    switch (s) {
      case 'draft':
        return 'Borrador';
      case 'active':
        return 'Activa';
      case 'archived':
        return 'Archivada';
      default:
        return 'Desconocido';
    }
  }

  statusSeverity(s: PlanningStatus): 'success' | 'info' | 'warn' | 'danger' {
    switch (s) {
      case 'draft':
        return 'warn';
      case 'active':
        return 'success';
      case 'archived':
        return 'danger';
      default:
        return 'info';
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
    this.sendPlanningVersion = item.version;
  }

  openSendDialogForCurrent(): void {
    if (!this.exportMenuVisibleForId) return;
    const id = this.exportMenuVisibleForId;
    this.exportMenuVisibleForId = null;

    // We don't need the server list here; best-effort version fallback.
    const version = this.sendPlanningVersion;
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
    // Email export isn't implemented server-side yet.
    return false;
  }

  sendEmail(): void {
    this.toast.add({
      severity: 'info',
      summary: 'No disponible',
      detail: 'El envío por correo aún no está implementado en el backend. Usa la exportación a PDF/CSV.',
    });
  }

  exportCurrent(format: 'pdf' | 'csv'): void {
    if (!this.exportMenuVisibleForId) return;
    const id = this.exportMenuVisibleForId;
    this.exportMenuVisibleForId = null;

    this.downloadingForId = id;
    this.downloadingFormat = format;
    this.toast.add({ severity: 'info', summary: 'Exportación', detail: `Descargando ${format.toUpperCase()}…` });

    const version = this.sendPlanningVersion;
    if (!version) {
      this.downloadingForId = null;
      this.downloadingFormat = null;
      this.toast.add({ severity: 'warn', summary: 'Sin versión', detail: 'No hay versión disponible para exportar este planning.' });
      return;
    }

    const req$ = format === 'pdf' ? this.api.exportPdf(id, version) : this.api.exportCsv(id, version);
    const filename = `planning-${id}-${version}.${format}`;

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
      accept: () => this.delete(item),
    });
  }

  private async delete(item: PlanningListItem): Promise<void> {
    try {
      await firstValueFrom(this.api.remove(String(item.id)));
      this.toast.add({ severity: 'success', summary: 'Eliminada', detail: 'Planificación eliminada.' });
      this.refresh();
    } catch (e: any) {
      this.toast.add({
        severity: 'error',
        summary: 'Error al eliminar',
        detail: e?.error?.message ?? e?.message ?? 'No se pudo eliminar la planificación.',
      });
    }
  }
}
