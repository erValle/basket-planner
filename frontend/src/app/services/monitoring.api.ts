import { inject, Injectable } from '@angular/core';
import { catchError, map, of } from 'rxjs';

import { ApiClient } from './api-client';
import { MonitoringBackendKpis, MonitoringOverview, MonitoringRange, MonitoringRecommenderKpis } from '../models/monitoring';

@Injectable({ providedIn: 'root' })
export class MonitoringApiService {
  private readonly api = inject(ApiClient);

  getOverview(range: MonitoringRange) {
    return this.api.post<MonitoringOverview>('/api/monitoring/overview', this.serializeRange(range)).pipe(
      map((res) => res ?? this.mockOverview()),
      catchError(() => of(this.mockOverview()))
    );
  }

  getBackend(range: MonitoringRange) {
    return this.api.post<MonitoringBackendKpis>('/api/monitoring/backend', this.serializeRange(range)).pipe(
      map((res) => res ?? this.mockOverview().backend),
      catchError(() => of(this.mockOverview().backend))
    );
  }

  getRecommender(range: MonitoringRange) {
    return this.api.post<MonitoringRecommenderKpis>('/api/monitoring/recommender', this.serializeRange(range)).pipe(
      map((res) => res ?? this.mockOverview().recommender),
      catchError(() => of(this.mockOverview().recommender))
    );
  }

  exportCsv(range: MonitoringRange) {
    // Backend-less: try to hit endpoint, but fallback to a small generated CSV.
    return this.api
      .post<Blob>('/api/monitoring/export.csv', this.serializeRange(range), {
        responseType: 'blob' as const,
      })
      .pipe(
        catchError(() => of(this.mockCsvBlob(range)))
      );
  }

  private serializeRange(range: MonitoringRange): { from?: string; to?: string } {
    return {
      from: range.from ? range.from.toISOString() : undefined,
      to: range.to ? range.to.toISOString() : undefined,
    };
  }

  private mockOverview(): MonitoringOverview {
    return {
      backend: {
        latencyMs: 138,
        errorRatePct: 0.7,
        throughputRps: 12.4,
      },
      recommender: {
        activeVersion: 'rec-1.4.2',
        lastRunAt: new Date(Date.now() - 1000 * 60 * 37).toISOString(),
        techCost: 'medium',
        cpuPct: 42,
        ramPct: 58,
      },
      exports: {
        exportsPerDay: 23,
        failuresPerDay: 1,
      },
    };
  }

  private mockCsvBlob(range: MonitoringRange): Blob {
    const from = range.from ? range.from.toISOString() : '';
    const to = range.to ? range.to.toISOString() : '';

    const o = this.mockOverview();

    const csv = [
      'from,to,backend_latency_ms,backend_error_rate_pct,backend_throughput_rps,recommender_active_version,recommender_last_run_at,recommender_tech_cost,recommender_cpu_pct,recommender_ram_pct,exports_per_day,exports_failures_per_day',
      [
        from,
        to,
        String(o.backend.latencyMs),
        String(o.backend.errorRatePct),
        String(o.backend.throughputRps),
        o.recommender.activeVersion,
        o.recommender.lastRunAt,
        o.recommender.techCost,
        String(o.recommender.cpuPct),
        String(o.recommender.ramPct),
        String(o.exports.exportsPerDay),
        String(o.exports.failuresPerDay),
      ].join(','),
    ].join('\n');

    return new Blob([csv], { type: 'text/csv;charset=utf-8' });
  }
}
