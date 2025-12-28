import { Injectable, inject } from '@angular/core';

import { ApiClient } from './api-client';

export type EquipmentStatus = 'available' | 'unavailable' | 'maintenance';

export interface EquipmentDto {
  id: number;
  name: string;
  clubId?: number | null;
  quantity: number;
  status?: EquipmentStatus;
  characteristics?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class EquipmentApi {
  private readonly api = inject(ApiClient);

  list(params?: { search?: string; clubId?: string }) {
    return this.api.get<EquipmentDto[]>('/api/equipment', { params: params ?? {} });
  }
}
