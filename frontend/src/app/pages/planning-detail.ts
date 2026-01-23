import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';
import { BpDialog } from '../components/bp-dialog';

import { PlanningApiService } from '../services/planning.api';
import { FeedbackApiService } from '../services/feedback.api';
import { UserContextService } from '../core/auth/user-context.service';
import { FeedbackSurveyAnswers, FeedbackSurveyListItem, FeedbackVersionAnswers } from '../models/feedback-survey';
import {
  PlanningBlock,
  PlanningDetailResponse,
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
    BpDialog,
    InputTextModule,
    TextareaModule,
    TooltipModule,
    PageHeader,
    AppShell,
  ],
  templateUrl: './planning-detail.html',
  styleUrl: './planning-detail.scss',
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

  // Download dialog
  downloadDialogOpen = false;

  formatOptions: Option[] = [
    { label: 'PDF', value: 'pdf' },
    { label: 'CSV', value: 'csv' },
  ];

  // Data
  detail: PlanningDetailResponse | null = null;
  blocks: PlanningBlock[] = [];

  // Exercise preview modal
  exercisePreviewDialogOpen = false;
  selectedExercise: any = null;

  // Survey feedback
  feedbackDialogOpen = false;
  savingFeedback = false;
  latestSurvey: FeedbackSurveyListItem | null = null;
  
  // All feedbacks for this planning (for admin/coach view)
  allFeedbacks: FeedbackSurveyListItem[] = [];
  loadingFeedbacks = false;
  feedbacksToShow = 3; // Número inicial de feedbacks a mostrar
  readonly FEEDBACKS_PER_PAGE = 3; // Incremento al hacer clic en "Ver más"

  scale1to10 = Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));
  scale0to10 = Array.from({ length: 11 }, (_, i) => ({ label: String(i), value: i }));
  scale1to5 = Array.from({ length: 5 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));

  draftSurvey: FeedbackVersionAnswers = {
    overall: 5,
    physicalEffort: 5,
    technicalEffort: 5,
    mentalEffort: 5,
    notes: '',
  };

  private readonly cdr = inject(ChangeDetectorRef);

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
    // items es directamente el array de sesiones guardado en el campo sessions
    const sessions = Array.isArray(items) ? items : [];
    const blocks: PlanningBlock[] = [];

    for (const s of sessions) {
      // Primero verificar si la sesión tiene bloques (estructura antigua)
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

      // Nueva estructura: sesiones directamente con exercises
      const exs = Array.isArray(s?.exercises) ? s.exercises : [];
      const sessionDuration = s?.metrics?.durationMinutes || 
                              exs.reduce((sum: number, e: any) => sum + (e?.durationMinutes || 0), 0);
      
      blocks.push({
        id: String(s?.sessionId ?? s?.id ?? `s-${Math.random().toString(16).slice(2)}`),
        name: `Sesión ${s?.sessionId || s?.day || ''}`.trim(),
        durationMin: Number(sessionDuration) || 0,
        focus: s?.goals?.join(', ') || undefined,
        notes: s?.metadata ? `Día: ${s.day || 'N/A'}` : undefined,
        exercises: exs.length
          ? exs.map((e: any) => ({
              id: String(e?.exerciseId ?? e?.id ?? `e-${Math.random().toString(16).slice(2)}`),
              name: String(e?.name ?? 'Ejercicio'),
              durationMin: e?.durationMinutes ?? e?.durationMin ?? undefined,
              notes: e?.description || undefined,
              // Información completa para el modal de previsualización
              type: e?.type,
              phase: e?.phase,
              difficulty: e?.difficulty,
              description: e?.description,
              equipment: e?.equipment || e?.materials || []
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

  // Calcula la media de las 4 dimensiones de dificultad
  calculateAverageDifficulty(difficulty: any): number {
    if (!difficulty || typeof difficulty !== 'object') return 0;
    
    const values = [
      difficulty.tactica,
      difficulty.tecnica,
      difficulty.fisica,
      difficulty.mental
    ].filter(v => typeof v === 'number');
    
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / values.length) * 10) / 10; // Redondear a 1 decimal
  }

  // Formatea la dificultad para mostrarla de forma abreviada
  formatDifficultyShort(difficulty: any): string {
    const avg = this.calculateAverageDifficulty(difficulty);
    return avg > 0 ? avg.toFixed(1) : 'N/A';
  }

  private mapTrainingPlanToDetail(plan: any, versionRow: any, versionLabel: string): PlanningDetailResponse {
    // El campo correcto es sessions, no items
    const sessionsData = versionRow?.sessions ?? plan?.activeVersion?.sessions ?? null;
    
    const blocks = this.buildUiBlocksFromItems(sessionsData);
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
      status: (['draft', 'active', 'archived'].includes(String(plan?.status))
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

  loadFeedbackForVersion(versionId: string): void {
    const currentUser = this.userContext.getUserSnapshot();
    const role = this.userContext.getRoleSnapshot();
    
    console.log('loadFeedbackForVersion called', { versionId, role, currentUser });
    
    if (!currentUser?.id) {
      // Usuario no autenticado, no cargar feedback
      this.latestSurvey = null;
      this.allFeedbacks = [];
      this.loadingFeedbacks = false;
      console.log('No user authenticated');
      this.cdr.markForCheck();
      return;
    }

    // Si es JUGADOR: cargar su propio feedback
    if (role === 'player') {
      this.feedbackApi.listRecentForPlayer(String(currentUser.id), 50).subscribe({
        next: (response) => {
          // Buscar el feedback más reciente para esta versión específica
          const feedbackForVersion = response.items.find(
            (item) => item.targetType === 'version' && item.targetId === versionId
          );
          
          if (feedbackForVersion) {
            this.latestSurvey = feedbackForVersion;
          } else {
            this.latestSurvey = null;
          }
          console.log('Player feedback loaded:', { feedbackForVersion, latestSurvey: this.latestSurvey });
          this.cdr.markForCheck();
        },
        error: (e: unknown) => {
          console.error('Error loading player feedback:', e);
          this.latestSurvey = null;
          this.cdr.markForCheck();
        },
      });
    }

    // Si es ADMIN/COACH/DT: cargar TODOS los feedbacks para visualizar
    if (this.canViewAllFeedbacks()) {
      console.log('Loading all feedbacks for version:', versionId);
      this.loadingFeedbacks = true;
      this.allFeedbacks = [];
      this.feedbacksToShow = this.FEEDBACKS_PER_PAGE; // Resetear contador al cargar nueva versión
      
      this.feedbackApi.listForVersion(Number(versionId)).subscribe({
        next: (allResponse) => {
          console.log('All feedbacks loaded:', allResponse);
          this.allFeedbacks = allResponse.items || [];
          console.log('All feedbacks array:', this.allFeedbacks);
          this.loadingFeedbacks = false;
          this.cdr.markForCheck();
        },
        error: (e: unknown) => {
          console.error('Error loading all feedbacks:', e);
          this.loadingFeedbacks = false;
          this.allFeedbacks = [];
          this.cdr.markForCheck();
        },
      });
    }
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
      a.overall == null || a.physicalEffort == null || a.technicalEffort == null || a.mentalEffort == null;
    if (isMissing) {
      this.toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'Completa todas las escalas.' });
      return;
    }

    this.savingFeedback = true;
    this.feedbackApi
      .createSurvey({
        playerId: String(currentUser.id),
        targetType: 'version',
        targetId: this.planningId,
        answers: this.draftSurvey,
      })
      .subscribe({
        next: (res) => {
          this.savingFeedback = false;
          
          this.latestSurvey = {
            id: (res?.id != null ? String(res.id) : `fp-${Math.random().toString(16).slice(2)}`),
            playerId: String(currentUser.id),
            targetType: 'version',
            targetId: this.planningId!,
            createdAt: new Date().toISOString(),
            answers: { ...this.draftSurvey },
          };
          this.toast.add({ severity: 'success', summary: 'Guardado', detail: 'Encuesta registrada.' });
          
          // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.feedbackDialogOpen = false;
            this.cdr.markForCheck();
          });
        },
        error: (e: unknown) => {
          this.savingFeedback = false;
          const msg = e instanceof Error ? e.message : 'No se pudo guardar el feedback.';
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
          this.cdr.markForCheck();
        },
        complete: () => {
          // Ensure loading state is always cleared
          if (this.savingFeedback) {
            this.savingFeedback = false;
          }
        }
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
      this.cdr.markForCheck();
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
          this.cdr.markForCheck();
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
            
            // Load feedback for this version
            this.loadFeedbackForVersion(resolvedVersionId);
            
            // Forzar detección de cambios
            this.cdr.markForCheck();
          },
          error: (e: unknown) => {
            this.loading = false;
            const msg = e instanceof Error ? e.message : 'No se pudo cargar la versión.';
            this.loadError = msg;
            this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
            this.cdr.markForCheck();
          },
        });
      },
      error: (e: unknown) => {
        this.loading = false;
        const msg = e instanceof Error ? e.message : 'No se pudo cargar la planificación.';
        this.loadError = msg;
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        this.cdr.markForCheck();
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

  createNewVersion(): void {
    if (!this.planningId) return;
    this.router.navigate(['/planning', this.planningId, 'edit'], {
      queryParams: { fromVersion: this.selectedVersion ?? this.detail?.version },
    });
  }

  acceptPlanning(): void {
    if (!this.planningId || !this.detail) return;
    
    this.api.updateStatus(this.planningId, 'active').subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'Planificación aceptada',
          detail: 'La planificación ha sido activada correctamente.',
        });
        this.load(); // Reload to show updated status
      },
      error: (err) => {
        this.toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo activar la planificación.',
        });
        console.error('Error accepting planning:', err);
      },
    });
  }

  canAcceptPlanning(): boolean {
    // Solo coaches y admins pueden activar planificaciones
    const role = this.userContext.getRoleSnapshot();
    const canManage = role === 'admin' || role === 'technical_director' || role === 'coach';
    return canManage && this.detail?.status === 'draft';
  }

  canManagePlanning(): boolean {
    // Solo coaches y admins pueden crear versiones, editar, etc.
    const role = this.userContext.getRoleSnapshot();
    return role === 'admin' || role === 'technical_director' || role === 'coach';
  }

  canViewAllFeedbacks(): boolean {
    // Solo coaches, technical_director y admins pueden ver todos los feedbacks
    const role = this.userContext.getRoleSnapshot();
    const canView = role === 'admin' || role === 'technical_director' || role === 'coach';
    console.log('canViewAllFeedbacks check:', { role, canView });
    return canView;
  }

  getVisibleFeedbacks(): FeedbackSurveyListItem[] {
    return this.allFeedbacks.slice(0, this.feedbacksToShow);
  }

  hasMoreFeedbacks(): boolean {
    return this.allFeedbacks.length > this.feedbacksToShow;
  }

  showMoreFeedbacks(): void {
    this.feedbacksToShow += this.FEEDBACKS_PER_PAGE;
  }

  showLessFeedbacks(): void {
    this.feedbacksToShow = this.FEEDBACKS_PER_PAGE;
  }

  isPlayerView(): boolean {
    const role = this.userContext.getRoleSnapshot();
    return role === 'player';
  }

  getBackRoute(): string {
    return this.isPlayerView() ? '/player' : '/planning';
  }

  openDownloadDialog(): void {
    this.downloadDialogOpen = true;
  }

  exportPdf(): void {
    if (!this.planningId) return;
    if (!this.selectedVersion) {
      this.toast.add({ severity: 'warn', summary: 'Selecciona una versión', detail: 'No hay versión seleccionada para exportar.' });
      return;
    }
    this.downloading = 'pdf';
    
    // Mostrar toast de descarga
    this.toast.add({ 
      severity: 'info', 
      summary: 'Exportación', 
      detail: 'Descargando PDF…',
      key: 'download-toast'
    });
    
    this.api.exportPdf(this.planningId, this.selectedVersion).subscribe({
      next: (blob) => {
        this.downloading = null;
        this.downloadBlob(blob, `planning-${this.planningId}-${this.selectedVersion ?? 'latest'}.pdf`);
        // Cerrar el toast de descarga
        this.toast.clear('download-toast');
        this.toast.add({ 
          severity: 'success', 
          summary: 'Exportación', 
          detail: 'PDF descargado correctamente',
          life: 3000
        });
      },
      error: (e: unknown) => {
        this.downloading = null;
        this.toast.clear('download-toast');
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
    
    // Mostrar toast de descarga
    this.toast.add({ 
      severity: 'info', 
      summary: 'Exportación', 
      detail: 'Descargando CSV…',
      key: 'download-toast'
    });
    
    this.api.exportCsv(this.planningId, this.selectedVersion).subscribe({
      next: (blob) => {
        this.downloading = null;
        this.downloadBlob(blob, `planning-${this.planningId}-${this.selectedVersion ?? 'latest'}.csv`);
        // Cerrar el toast de descarga
        this.toast.clear('download-toast');
        this.toast.add({ 
          severity: 'success', 
          summary: 'Exportación', 
          detail: 'CSV descargado correctamente',
          life: 3000
        });
      },
      error: (e: unknown) => {
        this.downloading = null;
        this.toast.clear('download-toast');
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

  // Exercise preview methods
  openExercisePreview(exercise: any): void {
    this.selectedExercise = exercise;
    this.exercisePreviewDialogOpen = true;
  }

  closeExercisePreview(): void {
    this.exercisePreviewDialogOpen = false;
    this.selectedExercise = null;
  }

  getDifficultyLabel(key: string): string {
    const labels: Record<string, string> = {
      tactica: 'Táctica',
      tecnica: 'Técnica',
      fisica: 'Física',
      mental: 'Mental'
    };
    return labels[key] || key;
  }

  getDifficultyValue(key: string): number {
    if (!this.selectedExercise?.difficulty || typeof this.selectedExercise.difficulty !== 'object') {
      return 0;
    }
    const difficulty = this.selectedExercise.difficulty as any;
    return difficulty[key] || 0;
  }

  getDifficultyKeys(): string[] {
    if (!this.selectedExercise?.difficulty || typeof this.selectedExercise.difficulty !== 'object') {
      return [];
    }
    return Object.keys(this.selectedExercise.difficulty);
  }
}
