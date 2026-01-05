import { Injectable, inject } from '@angular/core';

import { ApiClient } from './api-client';

export interface ClubDto {
  id: number;
  name: string;
  city?: string | null;
  teamsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClubCreatePayload {
  name: string;
  city?: string | null;
}

export interface ClubUpdatePayload {
  name?: string;
  city?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClubsApi {
  private readonly api = inject(ApiClient);

  list(params?: { search?: string }) {
    return this.api.get<ClubDto[]>('/api/clubs', { params: params ?? {} });
  }

  create(payload: ClubCreatePayload) {
    return this.api.post<ClubDto>('/api/clubs', payload);
  }

  update(id: number, payload: ClubUpdatePayload) {
    return this.api.put<ClubDto>(`/api/clubs/${encodeURIComponent(String(id))}`, payload);
  }

  remove(id: number) {
    return this.api.delete<{ ok: boolean }>(`/api/clubs/${encodeURIComponent(String(id))}`);
  }
}
