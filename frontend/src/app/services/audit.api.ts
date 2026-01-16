import { Injectable } from '@angular/core';

import { ApiClient } from './api-client';
import { AuditGetResponse, AuditListParams, AuditListResponse } from '../models/audit';

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  constructor(private readonly api: ApiClient) {}

  list(params: AuditListParams = {}) {
    // Backend: GET /api/audit-logs
    // We use GET + query params.
    // Filter out undefined/empty values to avoid validation errors
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    );
    return this.api.get<AuditListResponse>(`/api/audit-logs`, { params: cleanParams });
  }

  get(id: string) {
    // Backend currently exposes list-only for audit logs.
    // Keep method for future.
    return this.api.get<AuditGetResponse>(`/api/audit-logs/${encodeURIComponent(id)}`);
  }

  exportCsv(params: AuditListParams = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
    );
    return this.api.get(`/api/audit-logs/export.csv`, { 
      params: cleanParams,
      responseType: 'text'
    });
  }

  deleteAll() {
    return this.api.delete<{ deleted: number }>(`/api/audit-logs`);
  }
}
