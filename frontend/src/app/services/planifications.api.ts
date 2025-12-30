import { Injectable } from '@angular/core';

import { ApiClient } from './api-client';
import { PlanificationDraft, PlanificationGenerated } from '../models/planification';

@Injectable({ providedIn: 'root' })
export class PlanificationsApi {
  constructor(private readonly api: ApiClient) {}

  /**
   * Stub endpoint: backend contract TBD.
   * Intention: send draft + get a generated session/planification.
   */
  generatePlanification(draft: PlanificationDraft) {
    return this.api.post<PlanificationGenerated>('/api/planifications/generate', draft);
  }
}
