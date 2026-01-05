export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'EMAIL'
  | 'ASSIGN'
  | 'OTHER';

export interface AuditActor {
  id: string;
  name: string;
  email?: string;
}

export interface AuditLogListItem {
  id: string;
  createdAt: string; // ISO
  action: AuditAction;
  entity: string;
  entityId: string;
  summary: string;
  actor: AuditActor;
  metadata?: Record<string, unknown>;
}

export interface AuditLogDetail extends AuditLogListItem {
  // full payloads
  request?: unknown;
  response?: unknown;
  diff?: unknown;
}

export interface AuditListParams {
  entity?: string;
  action?: AuditAction | '';
  /** @deprecated Use userId (numeric). */
  user?: string;
  userId?: number;
  entityId?: string;
  requestId?: string;
  page?: number;
  pageSize?: number;
  from?: string; // ISO yyyy-mm-dd
  to?: string; // ISO yyyy-mm-dd
  limit?: number;
}

export interface AuditListResponse {
  items: AuditLogListItem[];
}

export interface AuditGetResponse {
  item: AuditLogDetail;
}
