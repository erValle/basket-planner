export type FeedbackSurveyScale1to10 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type FeedbackSurveyScale0to10 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type FeedbackSurveyScale1to5 = 1 | 2 | 3 | 4 | 5;

export interface FeedbackSurveyAnswers {
  rpe: FeedbackSurveyScale1to10;
  fatigue: FeedbackSurveyScale1to10;
  pain: FeedbackSurveyScale0to10;
  sleep: FeedbackSurveyScale1to5;
  stress: FeedbackSurveyScale1to5;
  mood: FeedbackSurveyScale1to5;
  notes?: string;
}

export type FeedbackTargetType = 'session' | 'planning';

export interface FeedbackSurveyListItem {
  id: string;
  playerId: string;
  targetType: FeedbackTargetType;
  targetId: string;
  createdAt: string; // ISO
  answers: FeedbackSurveyAnswers;
}

export interface FeedbackSurveyCreatePayload {
  playerId: string;
  targetType: FeedbackTargetType;
  targetId: string;
  answers: FeedbackSurveyAnswers;
}

export interface FeedbackSurveyCreateResponse {
  id: string;
}

export interface FeedbackSurveyListParams {
  playerId?: string;
  targetType?: FeedbackTargetType;
  targetId?: string;
  from?: string; // ISO
  to?: string; // ISO
  limit?: number;
}

export interface FeedbackSurveyListResponse {
  items: FeedbackSurveyListItem[];
}

export interface FeedbackSurveyWeeklyAggregate {
  week: string; // e.g. 2025-W52
  count: number;
  avgRpe?: number;
  avgFatigue?: number;
  avgPain?: number;
  avgSleep?: number;
  avgStress?: number;
  avgMood?: number;
}
