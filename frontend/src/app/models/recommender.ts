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
