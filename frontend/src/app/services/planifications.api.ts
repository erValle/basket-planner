import { Injectable } from '@angular/core';

import { ApiClient } from './api-client';
import { PlanificationDraft, PlanificationGenerated } from '../models/planification';

@Injectable({ providedIn: 'root' })
export class PlanificationsApi {
  constructor(private readonly api: ApiClient) {}

  /**
   * Backend endpoints live under /api/planning.
   * This method maps the existing frontend draft to the backend contract.
   */
  generatePlanification(draft: PlanificationDraft) {
    const mode = (draft as any)?.mode;
    if (mode === 'group') {
      return this.api.post<PlanificationGenerated>('/api/planning/generate/group', draft as any);
    }

    // Default to individual generation.
    return this.api.post<PlanificationGenerated>('/api/planning/generate/individual', draft as any);
  }
}
