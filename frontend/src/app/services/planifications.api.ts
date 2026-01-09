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
    const mode = draft.mode;

    const constraints = {
      // The backend expects equipment names (e.g., "Balones", "Conos"), not IDs
      // Use materialNames if available, otherwise fall back to empty array
      equipment: draft.materialNames ?? [],
    };

    const goals = (draft.tags ?? []).map((t) => String(t));

    if (mode === 'group') {
      const athleteIds = (draft.playerIds ?? [])
        .map((id) => Number(id))
        .filter((n) => Number.isFinite(n) && n > 0);

      return this.api.post<PlanificationGenerated>('/api/planning/generate/group', {
        group: {
          groupId: draft.groupId ? Number(draft.groupId) : undefined,
          name: draft.name,
          numberOfSessions: Number(draft.sessionsCount) || undefined,
          sessionDurationMinutes: Number(draft.duration) || undefined,
          // Normalize free text into backend enum.
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
    return this.api.post<PlanificationGenerated>('/api/planning/generate/individual', {
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
}
