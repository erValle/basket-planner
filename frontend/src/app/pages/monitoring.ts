import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { PageHeader } from '../components/page-header/page-header';
import { AppShell } from '../layout/app-shell/app-shell';

import { MonitoringApiService } from '../services/monitoring.api';
import { MonitoringOverview, MonitoringRange } from '../models/monitoring';

@Component({
  selector: 'app-monitoring',
  imports: [CommonModule, FormsModule, ButtonModule, TagModule, DatePickerModule, ProgressSpinnerModule, ToastModule, PageHeader, AppShell],
  templateUrl: './monitoring.html',
  styleUrl: './monitoring.css',
  providers: [MessageService],
})
export class Monitoring {
  private readonly api = inject(MonitoringApiService);
  private readonly messageService = inject(MessageService);

  range: MonitoringRange = {
    from: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    to: new Date(),
  };

  loading = false;
  error: string | null = null;
  overview: MonitoringOverview | null = null;

  hasRange = computed(() => Boolean(this.range.from && this.range.to));

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.error = null;

    this.api.getOverview(this.range).subscribe({
      next: (res) => {
        this.overview = res;
        this.loading = false;
      },
      error: (e: unknown) => {
        this.loading = false;
        this.error = e instanceof Error ? e.message : 'No se ha podido cargar monitoring.';
        this.messageService.add({
          severity: 'error',
          summary: 'Monitoring',
          detail: this.error,
        });
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
}
