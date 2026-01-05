export type PlanningStatus = 'draft' | 'generated' | 'published' | 'archived';

export interface PlanningListItem {
  id: string;
  date: string; // ISO or display-ready; backend TBD
  team: string;
  objective: string;
  status: PlanningStatus;
  version: string;
  author: string;
}

export interface PlanningListParams {
  club?: string;
  team?: string;
  status?: PlanningStatus | 'all';
  search?: string;
  from?: string; // ISO date
  to?: string; // ISO date

  page?: number;
  pageSize?: number;
}

export interface PlanningListResponse {
  items: PlanningListItem[];
  total: number;
}

export interface PlanningVersionInfo {
  label: string; // e.g. v1, v2
  value: string;
  createdAt?: string;
  author?: string;
}

export interface PlanningMetricSummary {
  totalDurationMin: number;
  estimatedLoad?: string;
}

export interface PlanningBlock {
  id: string;
  name: string;
  durationMin: number;
  focus?: string;
  notes?: string;
  // Backend might later send exercises; keep flexible.
  exercises?: Array<{
    id: string;
    name: string;
    durationMin?: number;
    notes?: string;
  }>;
}

export interface PlanningDetailResponse {
  id: string;
  title: string;
  date: string;
  team: string;
  objective: string;
  status: PlanningStatus;
  version: string;
  author: string;
  versions: PlanningVersionInfo[];
  metrics: PlanningMetricSummary;
  blocks: PlanningBlock[];
}

// --- Editor payload (manual versioning) ---
export interface PlanningExerciseEditor {
  id: string;
  name: string;

  series: number;
  reps: number;
  durationMin: number;
  intensity: string;
  restSec: number;
  material: string[];
  notes: string;
}

export type PlanningExportFormat = 'pdf' | 'csv';

export interface PlanningExportEmailPayload {
  recipients: string[];
  subject: string;
  message?: string;
  format: PlanningExportFormat;
  version?: string;
}

export interface PlanningExportEmailResponse {
  ok: boolean;
}

export interface PlanningBlockEditor {
  id: string;
  name: string;
  durationMin: number;
  notes: string;
  exercises: PlanningExerciseEditor[];
}

export interface PlanningSessionEditor {
  id: string;
  title: string;
  date: string;
  blocks: PlanningBlockEditor[];
}

export interface PlanningVersionCreatePayload {
  fromVersion?: string;
  sessions: PlanningSessionEditor[];
}
