import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';

import { ApiClient } from './api-client';
import { FeedbackSurveyCreatePayload, FeedbackSurveyListResponse } from '../models/feedback-survey';

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
      // Session-level feedback uses RPE-based scales
      rating.rpe = payload.answers?.rpe;
      rating.fatigue = payload.answers?.fatigue;
      rating.pain = payload.answers?.pain;
      rating.sleep = payload.answers?.sleep;
      rating.stress = payload.answers?.stress;
      rating.mood = payload.answers?.mood;
    } else {
      // Version-level feedback uses effort-based scales
      rating.overall = payload.answers?.rpe || 5;
      rating.physicalEffort = payload.answers?.fatigue || 5;
      rating.mentalEffort = payload.answers?.stress || 3;
      rating.technicalEffort = payload.answers?.mood || 3;
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
   * Real backend: GET /api/feedbacks?trainingPlanVersionId=...&userId=...
   * 
   * Note: the backend currently returns raw Feedback rows and doesn't include player identity.
   * We return a compatible empty list response to keep the dashboard UI stable.
   */
  listRecentForPlayer(_playerId: string, _limit = 5) {
    // Until we have a backend endpoint that returns per-player surveys (and mapping logic),
    // keep the UI stable by returning an empty list.
    const empty: FeedbackSurveyListResponse = { items: [] };
    return of(empty);
  }
}
