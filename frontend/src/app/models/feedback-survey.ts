export type FeedbackSurveyScale1to10 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type FeedbackSurveyScale0to10 = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type FeedbackSurveyScale1to5 = 1 | 2 | 3 | 4 | 5;

// Session-level feedback: effort-based scales
export interface FeedbackSessionAnswers {
    overall: FeedbackSurveyScale1to10;
    physicalEffort: FeedbackSurveyScale1to10;
    technicalEffort: FeedbackSurveyScale1to10;
    mentalEffort: FeedbackSurveyScale1to10;
    notes?: string;
}

// Version-level feedback: effort-based scales
export interface FeedbackVersionAnswers {
    overall: FeedbackSurveyScale1to10;
    physicalEffort: FeedbackSurveyScale1to10;
    technicalEffort: FeedbackSurveyScale1to10;
    mentalEffort: FeedbackSurveyScale1to10;
    notes?: string;
}

// Union type for both session and version answers
export type FeedbackSurveyAnswers = FeedbackSessionAnswers | FeedbackVersionAnswers;

export type FeedbackTargetType = 'session' | 'version';

export interface FeedbackSurveyListItem {
    id: string;
    playerId: string;
    targetType: FeedbackTargetType;
    targetId: string;
    createdAt: string; // ISO
    answers: FeedbackSurveyAnswers;
    planningName?: string; // Name of the training plan
    playerName?: string; // Name or email of the player who submitted feedback
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
    avgOverall?: number;
    avgPhysicalEffort?: number;
    avgTechnicalEffort?: number;
    avgMentalEffort?: number;
}
