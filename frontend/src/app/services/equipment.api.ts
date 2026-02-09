import { Injectable, inject } from '@angular/core';

import { ApiClient } from './api-client';

export type EquipmentStatus = 'available' | 'unavailable' | 'maintenance';

export interface EquipmentDto {
    id: number;
    name: string;
    clubId?: number | null;
    status?: EquipmentStatus;
    characteristics?: Record<string, unknown>;
    createdAt?: string;
    updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class EquipmentApi {
    private readonly api = inject(ApiClient);

    list(params?: { search?: string; clubId?: string }) {
        // Filtrar parámetros undefined para evitar enviar "undefined" como string
        const filteredParams: Record<string, string> = {};
        if (params?.search !== undefined) filteredParams['search'] = params.search;
        if (params?.clubId !== undefined) filteredParams['clubId'] = params.clubId;

        return this.api.get<EquipmentDto[]>('/api/equipment', { params: filteredParams });
    }

    create(payload: Partial<EquipmentDto>) {
        return this.api.post<EquipmentDto>('/api/equipment', payload);
    }

    update(id: number, payload: Partial<EquipmentDto>) {
        return this.api.put<EquipmentDto>(
            `/api/equipment/${encodeURIComponent(String(id))}`,
            payload,
        );
    }

    remove(id: number) {
        return this.api.delete<{ ok: boolean }>(`/api/equipment/${encodeURIComponent(String(id))}`);
    }
}
