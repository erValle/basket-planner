export type AuditAction = string; // Actions are now dynamic strings like 'http_request.success'

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
    requestId?: string;
    summary: string;
    actor: AuditActor;
    metadata?: Record<string, unknown>;
}

// Detail now matches list item - no extra fields needed
export interface AuditLogDetail extends AuditLogListItem {}

/* Export functionality commented out for future use
export interface AuditExportParams {
  format: 'json' | 'csv';
  from?: string;
  to?: string;
  entity?: string;
  action?: string;
}

export interface AuditExportResponse {
  url: string;
  filename: string;
}
*/

export interface AuditListParams {
    entity?: string;
    action?: AuditAction | '';
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
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
}

export interface AuditGetResponse {
    item: AuditLogDetail;
}
