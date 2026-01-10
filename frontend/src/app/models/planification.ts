export type PlanningMode = 'individual' | 'group';

export interface PlanificationDraft {
  name: string;
  duration: number; // Duración máxima por sesión (en minutos)
  sessionsCount?: number; // Número de sesiones deseadas
  summary: string;
  objective: string;
  intensity: string;
  mode: PlanningMode;

  // Target
  playerId?: string | null;
  playerIds?: string[];
  groupId?: string | null;

  // Restrictions
  materialIds?: string[];
  materialNames?: string[]; // Equipment names for backend validation
  tags?: string[];
}

export interface PlanificationGenerated {
  id: string;
  versionId?: string;
  title?: string;
  createdAt?: string;
  generatedAt?: string;
  kind?: 'individual' | 'group';
  modelVersion?: string;
  // Keep it flexible; backend contract TBD.
  payload?: unknown;
  sessions?: unknown[];
  metrics?: unknown;
  inputSummary?: unknown;
  athletes?: unknown[];
}
