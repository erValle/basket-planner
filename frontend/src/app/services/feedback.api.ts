import { Injectable } from '@angular/core';

import { ApiClient } from './api-client';
import {
  FeedbackSurveyCreatePayload,
  FeedbackSurveyCreateResponse,
  FeedbackSurveyListParams,
  FeedbackSurveyListResponse,
} from '../models/feedback-survey';

@Injectable({ providedIn: 'root' })
export class FeedbackApiService {
  constructor(private readonly api: ApiClient) {}

  createSurvey(payload: FeedbackSurveyCreatePayload) {
    return this.api.post<FeedbackSurveyCreateResponse>(`/api/feedback/surveys`, payload);
  }

  listSurveys(params: FeedbackSurveyListParams = {}) {
    // Keep it as a POST to avoid query string building for the stub.
    return this.api.post<FeedbackSurveyListResponse>(`/api/feedback/surveys/search`, params);
  }

  listRecentForPlayer(playerId: string, limit = 5) {
    return this.listSurveys({ playerId, limit });
  }
}
