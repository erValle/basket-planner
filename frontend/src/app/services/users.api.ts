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

  block(id: string) {
    return this.api.post<{ ok: boolean }>(`/api/users/${encodeURIComponent(id)}/block`, {});
  }

  unblock(id: string) {
    return this.api.post<{ ok: boolean }>(`/api/users/${encodeURIComponent(id)}/unblock`, {});
  }

  remove(id: string) {
    return this.api.delete<{ ok: boolean }>(`/api/users/${encodeURIComponent(id)}`);
  }
}
