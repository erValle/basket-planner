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
  teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam = this.teamsTop[0];

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
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toast: MessageService,
  ) {}

  openFeedback(): void {
    this.feedbackDialogOpen = true;
  }

  closeFeedback(): void {
    this.feedbackDialogOpen = false;
  }

  saveFeedback(): void {
    if (this.savingFeedback) return;
    if (!this.planningId) return;

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
        playerId: 'p1',
        targetType: 'planning',
        targetId: this.planningId,
        answers: this.draftSurvey,
      })
      .subscribe({
        next: (res) => {
          this.savingFeedback = false;
          this.feedbackDialogOpen = false;
          this.latestSurvey = {
            id: res?.id ?? `fp-${Math.random().toString(16).slice(2)}`,
            playerId: 'p1',
            targetType: 'planning',
            targetId: this.planningId!,
            createdAt: new Date().toISOString(),
            answers: { ...this.draftSurvey },
          };
          this.toast.add({ severity: 'success', summary: 'Guardado', detail: 'Encuesta registrada (stub).' });
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

  private mockDetail(id: string, version: string): PlanningDetailResponse {
    const versions: PlanningVersionInfo[] = [
      { label: 'v1', value: 'v1', createdAt: '2025-12-20', author: 'P. Valle' },
      { label: 'v2', value: 'v2', createdAt: '2025-12-22', author: 'P. Valle' },
      { label: 'v3', value: 'v3', createdAt: '2025-12-29', author: 'Staff' },
    ];

    return {
      id,
      title: `Planificación ${id}`,
      date: '2025-12-29',
      team: 'Senior Masculino',
      objective: 'Mejorar transiciones ofensivas y rebote defensivo.',
      status: version === 'v1' ? 'draft' : version === 'v2' ? 'generated' : 'published',
      version,
      author: version === 'v3' ? 'Staff' : 'P. Valle',
      versions,
      metrics: {
        totalDurationMin: 90,
        estimatedLoad: 'RPE 6 · 540 u.a.',
      },
      blocks: [
        {
          id: 'b1',
          name: 'Calentamiento',
          durationMin: 15,
          focus: 'Movilidad + activación',
          notes: 'RPE objetivo 4/10',
        },
        {
          id: 'b2',
          name: 'Parte principal',
          durationMin: 60,
          focus: 'Transición 3v2 + 4v3, rebote y 5v5',
          notes: 'Controlar carga y pausas',
          exercises: [
            { id: 'e1', name: '3v2 continuo', durationMin: 12, notes: '3 series · 90s' },
            { id: 'e2', name: '4v3 + rebote', durationMin: 18, notes: 'Foco: cierre defensivo' },
          ],
        },
        {
          id: 'b3',
          name: 'Vuelta a la calma',
          durationMin: 15,
          focus: 'Estiramientos + respiración',
          notes: 'Recuperación activa',
        },
      ],
    };
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

    const version = this.selectedVersion ?? undefined;
    this.api.get(this.planningId, version).subscribe({
      next: (res) => {
        this.loading = false;

        // Backend not ready -> fallback to mock so UI is complete.
        const resolved = res?.id ? res : this.mockDetail(this.planningId!, this.selectedVersion ?? 'v3');
        this.detail = resolved;
        this.blocks = resolved.blocks ?? [];

        this.versionOptions = (resolved.versions ?? []).map((v) => ({ label: v.label, value: v.value }));
        if (!this.selectedVersion) this.selectedVersion = resolved.version;
        if (this.selectedVersion && this.versionOptions.length > 0) {
          const valid = this.versionOptions.some((o) => o.value === this.selectedVersion);
          if (!valid) this.selectedVersion = resolved.version;
        }
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
    return (
      !!this.planningId &&
      this.emailModel.recipients.length > 0 &&
      this.emailModel.subject.trim().length > 0 &&
      (this.emailModel.format === 'pdf' || this.emailModel.format === 'csv')
    );
  }

  sendEmail(): void {
    if (!this.planningId) return;
    if (!this.canSendEmail()) {
      this.toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'Añade destinatarios y asunto.' });
      return;
    }

    this.sendingEmail = true;
    const payload: PlanningExportEmailPayload = {
      recipients: this.emailModel.recipients,
      subject: this.emailModel.subject,
      message: this.emailModel.message || undefined,
      format: this.emailModel.format as PlanningExportFormat,
      version: this.emailModel.version || undefined,
    };

    this.api.sendExportEmail(this.planningId, payload).subscribe({
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

  exportPdf(): void {
    if (!this.planningId) return;
    this.downloading = 'pdf';
    this.toast.add({ severity: 'info', summary: 'Exportación', detail: 'Descargando PDF…' });
    this.api.exportPdf(this.planningId, this.selectedVersion ?? undefined).subscribe({
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
    this.downloading = 'csv';
    this.toast.add({ severity: 'info', summary: 'Exportación', detail: 'Descargando CSV…' });
    this.api.exportCsv(this.planningId, this.selectedVersion ?? undefined).subscribe({
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
