import { Injectable } from '@angular/core';

import { ApiClient } from './api-client';
import {
  AdminUserDetail,
  AdminUserListParams,
  AdminUserListResponse,
  AdminUserUpsertPayload,
} from '../models/user-admin';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  constructor(private readonly api: ApiClient) {}

  list(params: AdminUserListParams) {
    return this.api.get<AdminUserListResponse>('/api/users', { params });
  }

  get(id: string) {
    return this.api.get<AdminUserDetail>(`/api/users/${encodeURIComponent(id)}`);
  }

  create(payload: AdminUserUpsertPayload) {
    return this.api.post<{ id: string }>('/api/users', payload);
  }

  update(id: string, payload: AdminUserUpsertPayload) {
    return this.api.put<{ ok: boolean }>(`/api/users/${encodeURIComponent(id)}`, payload);
  }

  setPassword(id: string, newPassword: string) {
    return this.api.put<{ ok: boolean }>(`/api/users/${encodeURIComponent(id)}`, { password: newPassword } as any);
  }

  block(id: string) {
    // Backend does not expose /block|/unblock endpoints yet.
    // Use PUT /api/users/:id with status change instead.
    return this.update(id, { status: 'blocked' } as any);
  }

  unblock(id: string) {
    return this.update(id, { status: 'active' } as any);
  }

  remove(id: string) {
    return this.api.delete<{ ok: boolean }>(`/api/users/${encodeURIComponent(id)}`);
  }
}
