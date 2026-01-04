import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';

import { PlanningApiService } from '../services/planning.api';
import { FeedbackApiService } from '../services/feedback.api';
import { UserContextService } from '../core/auth/user-context.service';
import { FeedbackSurveyAnswers, FeedbackSurveyListItem } from '../models/feedback-survey';
import {
  PlanningBlock,
  PlanningDetailResponse,
  PlanningExportEmailPayload,
  PlanningExportFormat,
  PlanningStatus,
  PlanningVersionInfo,
} from '../models/planning';

type Option = { label: string; value: string };

@Component({
  selector: 'app-planning-detail',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    SelectModule,
    TagModule,
    ToastModule,
    ProgressSpinnerModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    PageHeader,
    AppShell,
  ],
  templateUrl: './planning-detail.html',
  styleUrl: './planning-detail.css',
  providers: [MessageService],
})
export class PlanningDetail {
  loading = false;
  loadError: string | null = null;
  emptyState = false;

  planningId: string | null = null;

  versionOptions: Option[] = [];
  selectedVersion: string | null = null;

  downloading: 'pdf' | 'csv' | null = null;

  // Email dialog
  sendDialogOpen = false;
  sendingEmail = false;
  emailModel: PlanningExportEmailPayload = {
    recipients: [],
    subject: '',
    message: '',
    format: 'pdf',
    version: undefined,
  };

  recipientDraft = '';

  formatOptions: Option[] = [
    { label: 'PDF', value: 'pdf' },
    { label: 'CSV', value: 'csv' },
  ];

  // Data
  detail: PlanningDetailResponse | null = null;
  blocks: PlanningBlock[] = [];

  // Survey feedback
  feedbackDialogOpen = false;
  savingFeedback = false;
  latestSurvey: FeedbackSurveyListItem | null = null;

  scale1to10 = Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));
  scale0to10 = Array.from({ length: 11 }, (_, i) => ({ label: String(i), value: i }));
  scale1to5 = Array.from({ length: 5 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));

  draftSurvey: FeedbackSurveyAnswers = {
    rpe: 5,
    fatigue: 5,
    pain: 0,
    sleep: 3,
    stress: 3,
    mood: 3,
    notes: '',
  };

  constructor(
    private readonly api: PlanningApiService,
    private readonly feedbackApi: FeedbackApiService,
    private readonly userContext: UserContextService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toast: MessageService,
  ) {}

  private formatIsoDate(value: unknown): string {
    if (!value) return new Date().toISOString().slice(0, 10);
    const d = new Date(value as any);
    if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  }

  private buildUiBlocksFromItems(items: any): PlanningBlock[] {
    const sessions = Array.isArray(items?.sessions) ? items.sessions : [];
    const blocks: PlanningBlock[] = [];

    for (const s of sessions) {
      const sBlocks = Array.isArray(s?.blocks) ? s.blocks : [];
      if (sBlocks.length) {
        for (const b of sBlocks) {
          blocks.push({
            id: String(b?.id ?? `b-${Math.random().toString(16).slice(2)}`),
            name: String(b?.name ?? 'Bloque'),
            durationMin: Number(b?.durationMin ?? 0) || 0,
            focus: (b?.focus != null ? String(b.focus) : undefined) as any,
            notes: (b?.notes != null ? String(b.notes) : undefined) as any,
            exercises: Array.isArray(b?.exercises)
              ? b.exercises.map((e: any) => ({
                  id: String(e?.id ?? `e-${Math.random().toString(16).slice(2)}`),
                  name: String(e?.name ?? 'Ejercicio'),
                  durationMin: e?.durationMin != null ? Number(e.durationMin) : undefined,
                  notes: e?.notes != null ? String(e.notes) : undefined,
                }))
              : undefined,
          });
        }
        continue;
      }

      // Fallback: if session has exercises directly.
      const exs = Array.isArray(s?.exercises) ? s.exercises : [];
      blocks.push({
        id: String(s?.id ?? `s-${Math.random().toString(16).slice(2)}`),
        name: String(s?.title ?? s?.name ?? 'Sesión'),
        durationMin: Number(s?.durationMin ?? 0) || 0,
        focus: (s?.focus != null ? String(s.focus) : undefined) as any,
        notes: (s?.notes != null ? String(s.notes) : undefined) as any,
        exercises: exs.length
          ? exs.map((e: any) => ({
              id: String(e?.id ?? `e-${Math.random().toString(16).slice(2)}`),
              name: String(e?.name ?? 'Ejercicio'),
              durationMin: e?.durationMin != null ? Number(e.durationMin) : undefined,
              notes: e?.notes != null ? String(e.notes) : undefined,
            }))
          : undefined,
      });
    }

    return blocks;
  }

  private computeMetrics(blocks: PlanningBlock[]) {
    const totalDurationMin = blocks.reduce((acc, b) => acc + (Number(b.durationMin) || 0), 0);
    return {
      totalDurationMin,
      estimatedLoad: undefined,
    };
  }

  private mapTrainingPlanToDetail(plan: any, versionRow: any, versionLabel: string): PlanningDetailResponse {
    const items = versionRow?.items ?? plan?.activeVersion?.items ?? null;
    const blocks = this.buildUiBlocksFromItems(items);
    const metrics = this.computeMetrics(blocks);

    const versions: PlanningVersionInfo[] = (Array.isArray(plan?.versions) ? plan.versions : [])
      .slice()
      .sort((a: any, b: any) => Number(b?.versionNumber ?? 0) - Number(a?.versionNumber ?? 0))
      .map((v: any) => ({
        label: `v${v?.versionNumber ?? v?.id}`,
        value: String(v?.id),
        createdAt: this.formatIsoDate(v?.createdAt ?? v?.date),
        author: v?.createdById != null ? `user:${v.createdById}` : '- ',
      }));

    return {
      id: String(plan?.id),
      title: plan?.name ? String(plan.name) : `Planificación ${plan?.id}`,
      date: this.formatIsoDate(versionRow?.date ?? plan?.activeVersion?.date ?? plan?.createdAt),
      team: plan?.targetType === 'group' ? 'Equipo' : 'Individual',
      objective: plan?.name ? String(plan.name) : '',
      status: (['draft', 'generated', 'published', 'archived'].includes(String(plan?.status))
        ? String(plan.status)
        : 'draft') as any,
      version: versionLabel,
      author: plan?.createdById != null ? `user:${plan.createdById}` : '-',
      versions,
      metrics: {
        totalDurationMin: metrics.totalDurationMin,
        estimatedLoad: metrics.estimatedLoad,
      } as any,
      blocks,
    };
  }

  openFeedback(): void {
    this.feedbackDialogOpen = true;
  }

  closeFeedback(): void {
    this.feedbackDialogOpen = false;
  }

  saveFeedback(): void {
    if (this.savingFeedback) return;
    if (!this.planningId) return;

    const currentUser = this.userContext.getUserSnapshot();
    if (!currentUser?.id) {
      this.toast.add({
        severity: 'warn',
        summary: 'Sesión requerida',
        detail: 'Inicia sesión para enviar el feedback.',
      });
      return;
    }

    const a = this.draftSurvey;
    const isMissing =
      a.rpe == null || a.fatigue == null || a.pain == null || a.sleep == null || a.stress == null || a.mood == null;
    if (isMissing) {
      this.toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'Completa todas las escalas.' });
      return;
    }

    this.savingFeedback = true;
    this.feedbackApi
      .createSurvey({
        playerId: String(currentUser.id),
        targetType: 'planning',
        targetId: this.planningId,
        answers: this.draftSurvey,
      })
      .subscribe({
        next: (res) => {
          this.savingFeedback = false;
          this.feedbackDialogOpen = false;
          this.latestSurvey = {
            id: (res?.id != null ? String(res.id) : `fp-${Math.random().toString(16).slice(2)}`),
            playerId: String(currentUser.id),
            targetType: 'planning',
            targetId: this.planningId!,
            createdAt: new Date().toISOString(),
            answers: { ...this.draftSurvey },
          };
          this.toast.add({ severity: 'success', summary: 'Guardado', detail: 'Encuesta registrada.' });
        },
        error: (e: unknown) => {
          this.savingFeedback = false;
          const msg = e instanceof Error ? e.message : 'No se pudo guardar el feedback.';
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((p) => {
      const id = p.get('id');
      this.planningId = id;
      this.selectedVersion = this.route.snapshot.queryParamMap.get('version');
      this.load();
    });
  }

  load(): void {
    this.loadError = null;
    this.emptyState = false;

    if (!this.planningId) {
      this.emptyState = true;
      this.detail = null;
      this.blocks = [];
      return;
    }

    this.loading = true;

    this.api.get(this.planningId).subscribe({
      next: (plan) => {
        const selectedVersionId = this.selectedVersion;

        const versions = Array.isArray(plan?.versions) ? plan.versions : [];
        const activeVersionId = plan?.activeVersionId != null ? String(plan.activeVersionId) : null;
        const resolvedVersionId = selectedVersionId ?? activeVersionId ?? (versions[0]?.id != null ? String(versions[0].id) : null);

        if (!resolvedVersionId) {
          this.loading = false;
          this.emptyState = true;
          this.detail = null;
          this.blocks = [];
          return;
        }

        this.api.getVersion(this.planningId!, resolvedVersionId).subscribe({
          next: (versionRow) => {
            this.loading = false;

            const versionLabel = `v${versionRow?.versionNumber ?? resolvedVersionId}`;
            const resolved = this.mapTrainingPlanToDetail(plan, versionRow, versionLabel);

            this.detail = resolved;
            this.blocks = resolved.blocks ?? [];

            // options show labels, values are real version IDs so export works
            this.versionOptions = (resolved.versions ?? []).map((v: any) => ({ label: v.label, value: v.value }));
            this.selectedVersion = resolvedVersionId;
          },
          error: (e: unknown) => {
            this.loading = false;
            const msg = e instanceof Error ? e.message : 'No se pudo cargar la versión.';
            this.loadError = msg;
            this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
          },
        });
      },
      error: (e: unknown) => {
        this.loading = false;
        const msg = e instanceof Error ? e.message : 'No se pudo cargar la planificación.';
        this.loadError = msg;
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  onVersionChange(v: string): void {
    this.selectedVersion = v;
    // Keep it visible/shareable.
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { version: v },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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

  createNewVersion(): void {
    if (!this.planningId) return;
    this.router.navigate(['/planning', this.planningId, 'edit'], {
      queryParams: { fromVersion: this.selectedVersion ?? this.detail?.version },
    });
  }

  openSendDialog(): void {
    if (!this.planningId) return;
    this.emailModel = {
      recipients: [],
      subject: `Planificación ${this.planningId} (${this.selectedVersion ?? this.detail?.version ?? 'última'})`,
      message: '',
      format: 'pdf',
      version: this.selectedVersion ?? this.detail?.version ?? undefined,
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

  exportPdf(): void {
    if (!this.planningId) return;
    if (!this.selectedVersion) {
      this.toast.add({ severity: 'warn', summary: 'Selecciona una versión', detail: 'No hay versión seleccionada para exportar.' });
      return;
    }
    this.downloading = 'pdf';
    this.toast.add({ severity: 'info', summary: 'Exportación', detail: 'Descargando PDF…' });
    this.api.exportPdf(this.planningId, this.selectedVersion).subscribe({
      next: (blob) => {
        this.downloading = null;
        this.downloadBlob(blob, `planning-${this.planningId}-${this.selectedVersion ?? 'latest'}.pdf`);
      },
      error: (e: unknown) => {
        this.downloading = null;
        const msg = e instanceof Error ? e.message : 'No se pudo exportar PDF.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  exportCsv(): void {
    if (!this.planningId) return;
    if (!this.selectedVersion) {
      this.toast.add({ severity: 'warn', summary: 'Selecciona una versión', detail: 'No hay versión seleccionada para exportar.' });
      return;
    }
    this.downloading = 'csv';
    this.toast.add({ severity: 'info', summary: 'Exportación', detail: 'Descargando CSV…' });
    this.api.exportCsv(this.planningId, this.selectedVersion).subscribe({
      next: (blob) => {
        this.downloading = null;
        this.downloadBlob(blob, `planning-${this.planningId}-${this.selectedVersion ?? 'latest'}.csv`);
      },
      error: (e: unknown) => {
        this.downloading = null;
        const msg = e instanceof Error ? e.message : 'No se pudo exportar CSV.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    // Frontend-only download helper.
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.add({ severity: 'success', summary: 'Exportación', detail: `Descarga iniciada: ${filename}` });
  }
}
