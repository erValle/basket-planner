export type RecommenderTechCost = 'low' | 'medium' | 'high';

export type RecommenderStatus = {
  activeVersion: string;
  trainedAt: string; // ISO
  metrics: {
    accuracy: number; // 0..1
    coverage: number; // 0..1
    latencyMs: number;
  };
  techCost: RecommenderTechCost;
};

export type RecommenderTrainPayload = {
  dataset: 'last_30_days' | 'last_90_days' | 'season';
  algorithm: 'xgboost' | 'lightgbm' | 'baseline';
  maxIterations: number;
  learningRate: number;
  notes?: string;
};

export type RecommenderJobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export type RecommenderJob = {
  id: string;
  status: RecommenderJobStatus;
  startedAt?: string;
  finishedAt?: string;
  logs: string;
  errorMessage?: string;
  resultVersionId?: string;
};

export type RecommenderVersionListItem = {
  id: string;
  createdAt: string;
  trainedAt: string;
  algorithm: string;
  metrics: {
    accuracy: number;
    coverage: number;
    latencyMs: number;
  };
  techCost: RecommenderTechCost;
  isActive: boolean;
};

export type RecommenderListVersionsResponse = {
  items: RecommenderVersionListItem[];
};

export type GoalSuggestion = {
  goal: string;
  label: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  relevantTags: string[];
  estimatedDuration: number;
};

export type SuggestGoalsRequest = {
  context?: {
    playerLevel?: 'beginner' | 'intermediate' | 'advanced';
    intensity?: 'low' | 'medium' | 'high';
    sessionDuration?: number;
  };
};

export type SuggestGoalsResponse = {
  suggestions: GoalSuggestion[];
  allAvailableGoals: string[];
  modelVersion: string;
};
