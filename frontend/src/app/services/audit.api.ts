import { Injectable } from '@angular/core';

import { ApiClient } from './api-client';
import { AuditGetResponse, AuditListParams, AuditListResponse } from '../models/audit';

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  constructor(private readonly api: ApiClient) {}

  list(params: AuditListParams = {}) {
    return this.api.post<AuditListResponse>(`/api/audit/search`, params);
  }

  get(id: string) {
    return this.api.get<AuditGetResponse>(`/api/audit/${encodeURIComponent(id)}`);
  }
}
