import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';

import { RecommenderApiService } from '../services/recommender.api';
import {
  RecommenderJob,
  RecommenderJobStatus,
  RecommenderStatus,
  RecommenderTrainPayload,
  RecommenderVersionListItem,
} from '../models/recommender';

type Option<T extends string> = { label: string; value: T };

@Component({
  selector: 'app-recommender-page',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    PageHeader,
    AppShell,
  ],
  templateUrl: './recommender.html',
  styleUrl: './recommender.css',
  providers: [MessageService, ConfirmationService],
})
export class RecommenderPage {
  private readonly api = inject(RecommenderApiService);
  private readonly toast = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);

  // Estado
  statusLoading = false;
  statusError: string | null = null;
  status: RecommenderStatus | null = null;

  // Entrenar
  trainForm: RecommenderTrainPayload = {
    dataset: 'last_30_days',
    algorithm: 'xgboost',
    maxIterations: 200,
    learningRate: 0.05,
    notes: '',
  };

  datasetOptions: Option<RecommenderTrainPayload['dataset']>[] = [
    { label: 'Últimos 30 días', value: 'last_30_days' },
    { label: 'Últimos 90 días', value: 'last_90_days' },
    { label: 'Temporada', value: 'season' },
  ];

  algorithmOptions: Option<RecommenderTrainPayload['algorithm']>[] = [
    { label: 'XGBoost', value: 'xgboost' },
    { label: 'LightGBM', value: 'lightgbm' },
    { label: 'Baseline', value: 'baseline' },
  ];

  training = false;
  currentJobId: string | null = null;
  jobLoading = false;
  job: RecommenderJob | null = null;
  jobError: string | null = null;
  private pollHandle: number | null = null;

  // Versiones
  versionsLoading = false;
  versionsError: string | null = null;
  versions: RecommenderVersionListItem[] = [];
  activatingId: string | null = null;

  ngOnInit(): void {
    this.refreshAll();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  refreshAll(): void {
    this.loadStatus();
    this.loadVersions();
    if (this.currentJobId) this.loadJob(this.currentJobId);
  }

  loadStatus(): void {
    this.statusLoading = true;
    this.statusError = null;

    this.api.getStatus().subscribe({
      next: (res) => {
        this.status = res;
        this.statusLoading = false;
      },
      error: (e: unknown) => {
        this.statusLoading = false;
        const msg = e instanceof Error ? e.message : 'No se pudo cargar el estado del recomendador.';
        this.statusError = msg;
        this.toast.add({ severity: 'error', summary: 'Recomendador', detail: msg });
      },
    });
  }

  loadVersions(): void {
    this.versionsLoading = true;
    this.versionsError = null;

    this.api.listVersions().subscribe({
      next: (res) => {
        this.versionsLoading = false;
        this.versions = Array.isArray(res?.items) ? res.items : [];
      },
      error: (e: unknown) => {
        this.versionsLoading = false;
        const msg = e instanceof Error ? e.message : 'No se pudieron cargar las versiones.';
        this.versionsError = msg;
        this.toast.add({ severity: 'error', summary: 'Versiones', detail: msg });
      },
    });
  }

  confirmTrain(): void {
    this.confirmation.confirm({
      header: 'Lanzar entrenamiento',
      message: '¿Quieres lanzar un entrenamiento del recomendador con estos parámetros?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.launchTraining(),
    });
  }

  private launchTraining(): void {
    if (this.training) return;

    if (!this.trainForm.maxIterations || this.trainForm.maxIterations < 10) {
      this.toast.add({ severity: 'warn', summary: 'Validación', detail: 'Max iterations debe ser ≥ 10.' });
      return;
    }
    if (!this.trainForm.learningRate || this.trainForm.learningRate <= 0 || this.trainForm.learningRate > 1) {
      this.toast.add({ severity: 'warn', summary: 'Validación', detail: 'Learning rate debe estar entre 0 y 1.' });
      return;
    }

    this.training = true;
    this.jobError = null;

    this.api.train(this.trainForm).subscribe({
      next: (res) => {
        this.training = false;
        this.currentJobId = res.jobId;
        this.toast.add({ severity: 'info', summary: 'Entrenamiento', detail: `Job ${res.jobId} lanzado.` });
        this.loadJob(res.jobId);
      },
      error: (e: unknown) => {
        this.training = false;
        const msg = e instanceof Error ? e.message : 'No se pudo lanzar el entrenamiento.';
        this.toast.add({ severity: 'error', summary: 'Entrenamiento', detail: msg });
      },
    });
  }

  loadJob(jobId: string): void {
    this.jobLoading = true;
    this.jobError = null;

    this.api.getJob(jobId).subscribe({
      next: (res) => {
        this.jobLoading = false;
        this.job = res;

        if (res.status === 'RUNNING' || res.status === 'PENDING') {
          this.startPolling(jobId);
        } else {
          this.stopPolling();

          if (res.status === 'SUCCESS') {
            this.toast.add({ severity: 'success', summary: 'Entrenamiento', detail: 'Entrenamiento completado.' });
            this.loadStatus();
            this.loadVersions();
          }

          if (res.status === 'FAILED') {
            this.toast.add({ severity: 'error', summary: 'Entrenamiento', detail: res.errorMessage ?? 'Job fallido.' });
          }
        }
      },
      error: (e: unknown) => {
        this.jobLoading = false;
        const msg = e instanceof Error ? e.message : 'No se pudo cargar el job.';
        this.jobError = msg;
        this.toast.add({ severity: 'error', summary: 'Job', detail: msg });
      },
    });
  }

  private startPolling(jobId: string): void {
    if (this.pollHandle) return;
    this.pollHandle = window.setInterval(() => this.loadJob(jobId), 5000);
  }

  private stopPolling(): void {
    if (!this.pollHandle) return;
    window.clearInterval(this.pollHandle);
    this.pollHandle = null;
  }

  confirmActivate(v: RecommenderVersionListItem): void {
    if (v.isActive) return;
    this.confirmation.confirm({
      header: 'Activar versión',
      message: `¿Quieres activar la versión ${v.id}?`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.activateVersion(v),
    });
  }

  private activateVersion(v: RecommenderVersionListItem): void {
    if (this.activatingId) return;
    this.activatingId = v.id;

    this.api.activate(v.id).subscribe({
      next: () => {
        this.activatingId = null;
        this.toast.add({ severity: 'success', summary: 'Versiones', detail: `Versión ${v.id} activada.` });
        this.versions = this.versions.map((x) => ({ ...x, isActive: x.id === v.id }));
        this.loadStatus();
      },
      error: (e: unknown) => {
        this.activatingId = null;
        const msg = e instanceof Error ? e.message : 'No se pudo activar la versión.';
        this.toast.add({ severity: 'error', summary: 'Versiones', detail: msg });
      },
    });
  }

  techCostSeverity(cost: RecommenderStatus['techCost']): 'success' | 'warn' | 'danger' {
    if (cost === 'low') return 'success';
    if (cost === 'medium') return 'warn';
    return 'danger';
  }

  jobSeverity(status: RecommenderJobStatus): 'info' | 'warn' | 'success' | 'danger' {
    switch (status) {
      case 'PENDING':
        return 'warn';
      case 'RUNNING':
        return 'info';
      case 'SUCCESS':
        return 'success';
      case 'FAILED':
        return 'danger';
    }
  }

  formatIso(iso: string | undefined): string {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return isNaN(d.getTime()) ? iso : d.toLocaleString();
    } catch {
      return iso;
    }
  }

  pct(v: number): string {
    return `${Math.round(v * 100)}%`;
  }
}
