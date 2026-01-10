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
   * List plannings for listing screen.
   * Backend: GET /api/training-plans
   */
  list(params: PlanningListParams) {
    const query: any = {};
    // Current backend supports basic filters. Keep forward compatible params.
    if ((params as any)?.status) query.status = String((params as any).status);
    if ((params as any)?.page != null) query.page = String((params as any).page);
    if ((params as any)?.pageSize != null) query.pageSize = String((params as any).pageSize);

    // club/team/search/dateRange are not implemented by backend yet.
    return this.api.get<any>(`/api/training-plans`, { params: query });
  }

  /**
   * Get training plan detail.
   * Backend: GET /api/training-plans/:id
   */
  get(id: string, version?: string) {
    // NOTE: backend returns TrainingPlan shape; PlanningDetail maps it client-side.
    return this.api.get<any>(`/api/training-plans/${encodeURIComponent(id)}`, {
      params: {},
    });
  }

  /**
   * Get one version.
   * Backend: GET /api/training-plans/:trainingPlanId/versions/:id
   */
  getVersion(trainingPlanId: string, versionId: string) {
    return this.api.get<any>(
      `/api/training-plans/${encodeURIComponent(trainingPlanId)}/versions/${encodeURIComponent(versionId)}`,
      { params: {} },
    );
  }

  /**
   * Export a planning version.
   * Backend: GET /api/planning/:id/versions/:versionId/export?format=pdf
   */
  exportPdf(id: string, versionId: string) {
    return this.http.get(`/api/planning/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}/export`, {
      params: { format: 'pdf' },
      responseType: 'blob',
    });
  }

  /**
   * Backend: GET /api/planning/:id/versions/:versionId/export?format=csv
   */
  exportCsv(id: string, versionId: string) {
    return this.http.get(`/api/planning/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}/export`, {
      params: { format: 'csv' },
      responseType: 'blob',
    });
  }

  /**
   * Create a new version for a training plan.
   * Backend: POST /api/training-plans/:trainingPlanId/versions
   */
  createVersion(id: string, payload: unknown) {
    return this.api.post<any>(`/api/training-plans/${encodeURIComponent(id)}/versions`, payload);
  }

  /**
   * Create a new version with auto versionNumber.
   * Backend: POST /api/training-plans/:trainingPlanId/versions/new
   */
  createNewVersion(trainingPlanId: string, payload: unknown) {
    return this.api.post<any>(
      `/api/training-plans/${encodeURIComponent(trainingPlanId)}/versions/new`,
      payload,
    );
  }

  /**
   * Delete a training plan.
   * Backend: DELETE /api/training-plans/:id
   */
  remove(id: string) {
    return this.api.delete<void>(`/api/training-plans/${encodeURIComponent(id)}`);
  }

  /**
   * Update training plan status.
   * Backend: PUT /api/training-plans/:id
   */
  updateStatus(id: string, status: string) {
    return this.api.put<any>(`/api/training-plans/${encodeURIComponent(id)}`, { status });
  }

  /**
   * Email export is not implemented in backend yet.
   */
  sendExportEmail(id: string, payload: PlanningExportEmailPayload) {
    return this.api.post<PlanningExportEmailResponse>(
      `/api/planning/${encodeURIComponent(id)}/export/email`,
      payload,
    );
  }
}
