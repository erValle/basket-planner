import { Injectable } from '@angular/core';
import { of } from 'rxjs';

import { ApiClient } from './api-client';
import { FeedbackSurveyCreatePayload, FeedbackSurveyListResponse } from '../models/feedback-survey';

type ApiFeedbackRow = {
  id: number;
  trainingPlanVersionId: number;
  userId: number;
  rating: {
    physicalEffort?: number;
    technicalEffort?: number;
    mentalEffort?: number;
    overall?: number;
    // Backend schema allows unknown keys.
    [k: string]: unknown;
  };
  comments?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

@Injectable({ providedIn: 'root' })
export class FeedbackApiService {
  constructor(private readonly api: ApiClient) {}

  /**
   * Real backend: POST /api/feedbacks (or /api/feedback)
   * - associates feedback to a planning VERSION via trainingPlanVersionId
   * - associates feedback to the authenticated user via token
   */
  createSurvey(payload: FeedbackSurveyCreatePayload) {
    if (!payload?.targetId) throw new Error('targetId is required');

    // Frontend legacy payload uses `targetId` for planning/session.
    // We align it to backend by treating it as the trainingPlanVersionId.
    const trainingPlanVersionId = Number(payload.targetId);

    // Map the existing answers structure to backend rating schema.
    // We keep it simple: overall=RPE, plus effort signals derived from the other scales.
    const rating = {
      overall: payload.answers?.rpe,
      physicalEffort: payload.answers?.fatigue,
      mentalEffort: payload.answers?.stress,
      technicalEffort: payload.answers?.mood,
    };

    const body = {
      trainingPlanVersionId,
      rating,
      comments: payload.answers?.notes ?? null,
    };

    return this.api.post<ApiFeedbackRow>('/api/feedbacks', body);
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
