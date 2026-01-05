import { Injectable } from '@angular/core';

import { ApiClient } from './api-client';
import { AuditGetResponse, AuditListParams, AuditListResponse } from '../models/audit';

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  constructor(private readonly api: ApiClient) {}

  list(params: AuditListParams = {}) {
    // Backend: GET /api/audit-logs
    // We use GET + query params.
    return this.api.get<AuditListResponse>(`/api/audit-logs`, { params });
  }

  get(id: string) {
    // Backend currently exposes list-only for audit logs.
    // Keep method for future.
    return this.api.get<AuditGetResponse>(`/api/audit-logs/${encodeURIComponent(id)}`);
  }
}
