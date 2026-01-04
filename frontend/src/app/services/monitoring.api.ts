import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

import { ApiClient } from './api-client';
import { MonitoringBackendKpis, MonitoringOverview, MonitoringRange, MonitoringRecommenderKpis } from '../models/monitoring';

@Injectable({ providedIn: 'root' })
export class MonitoringApiService {
  private readonly api = inject(ApiClient);

  getOverview(range: MonitoringRange) {
    return this.api.post<MonitoringOverview>('/api/monitoring/overview', this.serializeRange(range)).pipe(
      map((res) => res)
    );
  }

  getBackend(range: MonitoringRange) {
    return this.api.post<MonitoringBackendKpis>('/api/monitoring/backend', this.serializeRange(range)).pipe(
      map((res) => res)
    );
  }

  getRecommender(range: MonitoringRange) {
    return this.api.post<MonitoringRecommenderKpis>('/api/monitoring/recommender', this.serializeRange(range)).pipe(
      map((res) => res)
    );
  }

  exportCsv(range: MonitoringRange) {
    return this.api.post<Blob>('/api/monitoring/export.csv', this.serializeRange(range), {
      responseType: 'blob' as const,
    });
  }

  private serializeRange(range: MonitoringRange): { from?: string; to?: string } {
    return {
      from: range.from ? range.from.toISOString() : undefined,
      to: range.to ? range.to.toISOString() : undefined,
    };
  }
}
