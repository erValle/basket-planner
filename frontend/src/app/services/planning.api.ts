import { Injectable } from '@angular/core';

import { ApiClient } from './api-client';
import { HttpClient } from '@angular/common/http';
import {
  PlanningDetailResponse,
  PlanningDraft,
  PlanningExportEmailPayload,
  PlanningExportEmailResponse,
  PlanningGenerated,
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
   * Generate a new planning (individual or group).
   * Backend: POST /api/planning/generate/individual or /api/planning/generate/group
   */
  generate(draft: PlanningDraft) {
    const mode = draft.mode;

    const constraints = {
      equipment: draft.materialNames ?? [],
    };

    const goals = (draft.tags ?? []).map((t) => String(t));

    if (mode === 'group') {
      const athleteIds = (draft.playerIds ?? [])
        .map((id) => Number(id))
        .filter((n) => Number.isFinite(n) && n > 0);

      return this.api.post<PlanningGenerated>('/api/planning/generate/group', {
        group: {
          groupId: draft.groupId ? Number(draft.groupId) : undefined,
          name: draft.name,
          numberOfSessions: Number(draft.sessionsCount) || undefined,
          sessionDurationMinutes: Number(draft.duration) || undefined,
          intensity: String(draft.intensity).toLowerCase() === 'alta'
            ? 'high'
            : String(draft.intensity).toLowerCase() === 'baja'
              ? 'low'
              : 'medium',
        },
        profiles: athleteIds.map((athleteId) => ({ athleteId })),
        goals,
        constraints,
      } as any);
    }

    // Individual
    const athleteId = draft.playerId ? Number(draft.playerId) : NaN;
    return this.api.post<PlanningGenerated>('/api/planning/generate/individual', {
      profile: {
        athleteId,
        numberOfSessions: Number(draft.sessionsCount) || undefined,
        sessionDurationMinutes: Number(draft.duration) || undefined,
        intensity: String(draft.intensity).toLowerCase() === 'alta'
          ? 'high'
          : String(draft.intensity).toLowerCase() === 'baja'
            ? 'low'
            : 'medium',
      },
      goals,
      constraints,
    } as any);
  }

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
