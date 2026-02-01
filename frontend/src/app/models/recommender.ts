export type RecommenderTechCost = 'low' | 'medium' | 'high';

export type TrainingMetadata = {
  trainedAt: string;
  trainingType: string;
  samples: number;
  epochs: number;
  durationSeconds: number;
  finalLoss: number;
  finalValLoss: number;
  exerciseCount: number;
  modelVersion: string;
  history?: {
    loss: number[];
    val_loss: number[];
  };
};

export type RecommenderMonitoring = {
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  queryLatencyMs: number;
  uptime: number;
  nodeVersion: string;
  platform: string;
  architecture?: {
    embeddingDim: number;
    userTowerLayers: number[];
    exerciseTowerLayers: number[];
    rankingLayers: number[];
    activation: string;
    dropoutRate: number;
    l2Regularization: number;
  };
  weights?: {
    neuralWeight: number;
    heuristicWeight: number;
    tagMatch: number;
    typeMatch: number;
    difficultyFit: number;
    typeVariety: number;
    uniqueness: number;
  };
  trainScript: string;
};

export type RecommenderStatus = {
  activeVersion: string;
  modelInfo?: {
    version: string;
    type: string;
    description: string;
    isInitialized?: boolean;
    isTrained?: boolean;
  };
  modelConfig?: {
    version: string;
    description: string;
    createdAt: string;
    totalGoals: number;
    totalTags: number;
  };
  statistics?: {
    totalPlans: number;
    totalExercises: number;
    topExercises: Array<{
      id: number;
      name: string;
      usageCount: number;
    }>;
    topGoals: Array<{
      goal: string;
      count: number;
    }>;
  };
  monitoring?: RecommenderMonitoring;
  training?: TrainingMetadata;
  trainedAt: string;
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
    intensity?: 'low' | 'medium' | 'high';
    sessionDuration?: number;
  };
};

export type SuggestGoalsResponse = {
  suggestions: GoalSuggestion[];
  allAvailableGoals: string[];
  modelVersion: string;
};
