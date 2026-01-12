import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiClient } from './api-client';
import { FeedbackSurveyCreatePayload, FeedbackSurveyListResponse, FeedbackSurveyListItem } from '../models/feedback-survey';

type ApiFeedbackRow = {
  id: number;
  trainingPlanVersionId: number;
  userId: number;
  targetType?: 'version' | 'session';
  sessionId?: string | null;
  rating: {
    physicalEffort?: number;
    technicalEffort?: number;
    mentalEffort?: number;
    overall?: number;
    rpe?: number;
    fatigue?: number;
    pain?: number;
    sleep?: number;
    stress?: number;
    mood?: number;
    [k: string]: unknown;
  };
  comments?: string | null;
  createdAt?: string;
  updatedAt?: string;
  trainingPlanVersion?: {
    trainingPlan?: {
      id: number;
      name: string;
    };
  };
};

type CanProvideFeedbackResponse = {
  canFeedback: boolean;
  reason?: string;
  assignment?: any;
};

@Injectable({ providedIn: 'root' })
export class FeedbackApiService {
  constructor(private readonly api: ApiClient) {}

  /**
   * Real backend: POST /api/feedbacks (or /api/feedback)
   * - associates feedback to a planning VERSION via trainingPlanVersionId
   * - associates feedback to the authenticated user via token
   * - supports both version-level and session-level feedback
   */
  createSurvey(payload: FeedbackSurveyCreatePayload) {
    if (!payload?.targetId) throw new Error('targetId is required');

    // Frontend uses `targetId` which we treat as trainingPlanVersionId
    const trainingPlanVersionId = Number(payload.targetId);

    // Determine if this is session or version feedback
    const targetType = payload.targetType || 'version';
    
    // For session feedback, extract sessionId from payload
    // Assuming frontend might pass it in the payload or we need to handle it
    const sessionId = (payload as any).sessionId || null;

    // Map the frontend answers to backend rating schema
    const rating: any = {};
    
    if (targetType === 'session') {
      // Session-level feedback uses effort-based scales
      const sessionAnswers = payload.answers as any;
      rating.overall = sessionAnswers.overall;
      rating.physicalEffort = sessionAnswers.physicalEffort;
      rating.technicalEffort = sessionAnswers.technicalEffort;
      rating.mentalEffort = sessionAnswers.mentalEffort;
    } else {
      // Version-level feedback uses effort-based scales
      const versionAnswers = payload.answers as any;
      rating.overall = versionAnswers.overall;
      rating.physicalEffort = versionAnswers.physicalEffort;
      rating.mentalEffort = versionAnswers.mentalEffort;
      rating.technicalEffort = versionAnswers.technicalEffort;
    }

    const body: any = {
      trainingPlanVersionId,
      targetType,
      rating,
      comments: payload.answers?.notes ?? null,
    };

    if (sessionId) {
      body.sessionId = sessionId;
    }

    return this.api.post<ApiFeedbackRow>('/api/feedbacks', body);
  }

  /**
   * Check if the current user can provide feedback for a version
   */
  canProvideFeedback(versionId: number): Observable<CanProvideFeedbackResponse> {
    return this.api.get<CanProvideFeedbackResponse>(`/api/feedbacks/version/${versionId}/can-provide`);
  }

  /**
   * Get aggregated stats for a training plan version
   */
  getVersionStats(versionId: number) {
    return this.api.get(`/api/feedbacks/version/${versionId}/stats`);
  }

  /**
   * Get aggregated stats for a specific session
   */
  getSessionStats(versionId: number, sessionId: string) {
    return this.api.get(`/api/feedbacks/version/${versionId}/session/${sessionId}/stats`);
  }

  /**
   * Real backend: GET /api/feedbacks?userId=...
   * 
   * Returns the list of feedback surveys for a specific player.
   */
  listRecentForPlayer(playerId: string, limit = 5): Observable<FeedbackSurveyListResponse> {
    return this.api.get<ApiFeedbackRow[]>(`/api/feedbacks?userId=${playerId}`).pipe(
      map((rows: ApiFeedbackRow[]) => {
        // Transform backend rows to FeedbackSurveyListItem format
        const items: FeedbackSurveyListItem[] = rows
          .slice(0, limit)
          .map((row: ApiFeedbackRow) => ({
            id: String(row.id),
            playerId: String(row.userId),
            targetType: (row.targetType || 'version') as 'version' | 'session',
            targetId: String(row.trainingPlanVersionId),
            createdAt: row.createdAt || new Date().toISOString(),
            planningName: row.trainingPlanVersion?.trainingPlan?.name || undefined,
            answers: {
              overall: (row.rating?.overall || 5) as any,
              physicalEffort: (row.rating?.physicalEffort || 5) as any,
              technicalEffort: (row.rating?.technicalEffort || 5) as any,
              mentalEffort: (row.rating?.mentalEffort || 5) as any,
              notes: row.comments || undefined,
            },
          }));
        return { items };
      })
    );
  }
}
