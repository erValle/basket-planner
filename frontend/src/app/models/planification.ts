export type PlanningMode = 'individual' | 'group';

export interface PlanificationDraft {
  name: string;
  duration: number;
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
  tags?: string[];
}

export interface PlanificationGenerated {
  id: string;
  title: string;
  createdAt: string;
  // Keep it flexible; backend contract TBD.
  payload?: unknown;
}
