import { Injectable, inject } from '@angular/core';

import { ApiClient } from './api-client';

export interface PlayerDto {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    email?: string | null;
    role?: string;
    status?: string;
    position?: string | null;
    category?: string | null;
    maxCategory?: string | null;
    height?: number | null;
    dateOfBirth?: string | null;
    clubs?: Array<{ id: number; name: string }>;
    teams?: Array<{ id: number; name: string; category?: string | null; clubId?: number | null }>;
    createdAt?: string;
    updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class PlayersApi {
    private readonly api = inject(ApiClient);

    list(params?: {
        search?: string;
        clubId?: number | string;
        teamId?: number | string;
        withoutTeam?: boolean;
        limit?: number | string;
    }) {
        const p: Record<string, string> = {};
        if (params?.search) p['search'] = String(params.search);
        if (params?.clubId != null && params.clubId !== '') p['clubId'] = String(params.clubId);
        if (params?.teamId != null && params.teamId !== '') p['teamId'] = String(params.teamId);
        if (params?.withoutTeam) p['withoutTeam'] = 'true';
        if (params?.limit != null && params.limit !== '') p['limit'] = String(params.limit);

        return this.api.get<PlayerDto[]>('/api/players', { params: p });
    }

    /**
     * Enroll an existing user (role=null) as a player and auto-assign default club membership.
     * Backend: POST /api/players/enroll
     */
    enroll(userId: string, payload?: { clubId?: number; startDate?: string }) {
        return this.api.post<any>('/api/players/enroll', {
            userId: Number(userId),
            ...(payload?.clubId ? { clubId: Number(payload.clubId) } : {}),
            ...(payload?.startDate ? { startDate: payload.startDate } : {}),
        });
    }

    /**
     * Restricted update for player profile (sports fields only).
     * Backend: PUT /api/players/:id
     */
    updateProfile(
        userId: string,
        payload: {
            firstName?: string;
            lastName?: string;
            status?: string;
            position?: string | null;
            category?: string | null;
            maxCategory?: string | null;
            height?: number | null;
            dateOfBirth?: string | null;
        },
    ) {
        return this.api.put<any>(
            `/api/players/${encodeURIComponent(String(userId))}`,
            payload as any,
        );
    }
}
