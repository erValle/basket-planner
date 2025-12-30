import { Injectable } from '@angular/core';

import { ApiClient } from './api-client';
import { HttpClient } from '@angular/common/http';
import {
  PlanningDetailResponse,
  PlanningExportEmailPayload,
  PlanningExportEmailResponse,
  PlanningListParams,
  PlanningListResponse,
} from '../models/planning';

@Injectable({ providedIn: 'root' })
export class PlanningApiService {
  constructor(
    private readonly api: ApiClient,
    private readonly http: HttpClient,
  ) {}

  /**
   * List plannings (stub endpoint).
   * Backend contract TBD.
   */
  list(params: PlanningListParams) {
    return this.api.get<PlanningListResponse>('/api/plannings', { params });
  }

  /**
   * Get planning detail (stub endpoint).
   */
  get(id: string, version?: string) {
    return this.api.get<PlanningDetailResponse>(`/api/plannings/${encodeURIComponent(id)}`, {
      params: version ? { version } : {},
    });
  }

  /**
   * Export planning as PDF (stub endpoint).
   */
  exportPdf(id: string, version?: string) {
    // Use HttpClient directly for blob downloads.
    return this.http.get(`/api/plannings/${encodeURIComponent(id)}/export/pdf`, {
      params: version ? { version } : {},
      responseType: 'blob',
    });
  }

  /**
   * Export planning as CSV (stub endpoint).
   */
  exportCsv(id: string, version?: string) {
    return this.http.get(`/api/plannings/${encodeURIComponent(id)}/export/csv`, {
      params: version ? { version } : {},
      responseType: 'blob',
    });
  }

  /**
   * Create a NEW version for a planning (stub endpoint).
   * Intention: backend clones + stores a new version.
   */
  createVersion(id: string, payload: unknown) {
    return this.api.post<{ version: string }>(`/api/plannings/${encodeURIComponent(id)}/versions`, payload);
  }

  /**
   * Send an export by email (frontend-only contract).
   * Placeholder endpoint.
   */
  sendExportEmail(id: string, payload: PlanningExportEmailPayload) {
    return this.api.post<PlanningExportEmailResponse>(
      `/api/plannings/${encodeURIComponent(id)}/export/email`,
      payload,
    );
  }
}
