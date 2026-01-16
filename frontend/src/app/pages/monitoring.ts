import { Component, computed, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { BehaviorSubject, switchMap, of, catchError, map, startWith, shareReplay } from 'rxjs';

import { PageHeader } from '../components/page-header/page-header';
import { AppShell } from '../layout/app-shell/app-shell';

import { MonitoringApiService } from '../services/monitoring.api';
import { MonitoringOverview, MonitoringRange } from '../models/monitoring';
import { RecommenderApiService } from '../services/recommender.api';
import { RecommenderStatus } from '../models/recommender';

interface MonitoringVm {
  loading: boolean;
  error: string | null;
  overview: MonitoringOverview | null;
}

@Component({
  selector: 'app-monitoring',
  imports: [CommonModule, FormsModule, ButtonModule, TagModule, DatePickerModule, ProgressSpinnerModule, ToastModule, ConfirmDialogModule, PageHeader, AppShell],
  templateUrl: './monitoring.html',
  styleUrl: './monitoring.scss',
  providers: [MessageService, ConfirmationService],
})
export class Monitoring {
  private readonly api = inject(MonitoringApiService);
  private readonly recommenderApi = inject(RecommenderApiService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Monitoring state
  range: MonitoringRange = {
    from: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    to: new Date(),
  };

  // Recommender state
  recommenderStatus: RecommenderStatus | null = null;
  recommenderLoading = false;
  recommenderError: string | null = null;

  hasRange = computed(() => Boolean(this.range.from && this.range.to));

  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  readonly vm$ = this.refresh$.pipe(
    switchMap(() =>
      this.api.getOverview(this.range).pipe(
        map((overview) => ({ loading: false, error: null, overview }) as MonitoringVm),
        startWith({ loading: true, error: null, overview: null } as MonitoringVm),
        catchError((e: unknown) => {
          const error = e instanceof Error ? e.message : 'No se ha podido cargar monitoring.';
          this.messageService.add({
            severity: 'error',
            summary: 'Monitoring',
            detail: error,
          });
          return of({ loading: false, error, overview: null } as MonitoringVm);
        }),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.refresh$.next();
    this.loadRecommenderStatus();
  }

  loadRecommenderStatus(): void {
    this.recommenderLoading = true;
    this.recommenderError = null;
    this.cdr.detectChanges();

    this.recommenderApi.getStatus().subscribe({
      next: (res) => {
        this.recommenderStatus = res;
        this.recommenderLoading = false;
        this.cdr.detectChanges();
      },
      error: (e: unknown) => {
        this.recommenderLoading = false;
        const msg = e instanceof Error ? e.message : 'No se pudo cargar el estado del recomendador.';
        this.recommenderError = msg;
        this.cdr.detectChanges();
      },
    });
  }

  clearRange(): void {
    this.range.from = null;
    this.range.to = null;
    this.refresh();
  }

  exportCsv(): void {
    this.api.exportCsv(this.range).subscribe({
      next: (blob) => {
        const from = this.range.from ? this.range.from.toISOString().slice(0, 10) : 'all';
        const to = this.range.to ? this.range.to.toISOString().slice(0, 10) : 'all';
        const filename = `monitoring_${from}_${to}.csv`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        this.messageService.add({
          severity: 'success',
          summary: 'Exportación',
          detail: 'Informe CSV descargado.',
        });
      },
      error: (e: unknown) => {
        const msg = e instanceof Error ? e.message : 'No se pudo exportar el CSV.';
        this.messageService.add({ severity: 'error', summary: 'Exportación', detail: msg });
      },
    });
  }

  techCostSeverity(cost: MonitoringOverview['recommender']['techCost']): 'success' | 'warn' | 'danger' {
    if (cost === 'low') return 'success';
    if (cost === 'medium') return 'warn';
    return 'danger';
  }

  formatIso(iso: string): string {
    try {
      const d = new Date(iso);
      return isNaN(d.getTime()) ? iso : d.toLocaleString();
    } catch {
      return iso;
    }
  }

  formatGoal(goal: string): string {
    const goalLabels: Record<string, string> = {
      improve_shooting: 'Mejorar Tiro',
      improve_passing: 'Mejorar Pase',
      improve_dribbling: 'Mejorar Dribling',
      improve_defense: 'Mejorar Defensa',
      improve_rebounding: 'Mejorar Rebote',
      improve_conditioning: 'Mejorar Condición Física',
      improve_team_play: 'Mejorar Juego en Equipo',
      warmup: 'Calentamiento',
      cooldown: 'Vuelta a la Calma',
    };
    return goalLabels[goal] || goal.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
