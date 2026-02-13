import { Injectable, inject } from '@angular/core';

import { ApiClient } from './api-client';

export interface TeamDto {
    id: number;
    name: string;
    category?: string | null;
    clubId?: number | null;
    coachId?: number | null;
    coach?: {
        id: number;
        name: string;
        email: string;
    } | null;
    playersCount?: number;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface TeamCreatePayload {
    name: string;
    clubId: number; // Required: a team must belong to a club
    coachId?: number | null;
    category?: string | null;
    active?: boolean;
}

export interface TeamUpdatePayload {
    name?: string;
    clubId?: number | null;
    coachId?: number | null;
    category?: string | null;
    active?: boolean;
}

export interface TeamPlayerDto {
    id: number;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    role?: string;
    position?: string | null;
    category?: string | null;
    status?: string;
}

@Injectable({ providedIn: 'root' })
export class TeamsApi {
    private readonly api = inject(ApiClient);

    list(params?: { search?: string; clubId?: string; category?: string }) {
        // Filtrar parámetros undefined para evitar enviar "undefined" como string
        const filteredParams: Record<string, string> = {};
        if (params?.search !== undefined) filteredParams['search'] = params.search;
        if (params?.clubId !== undefined) filteredParams['clubId'] = params.clubId;
        if (params?.category !== undefined) filteredParams['category'] = params.category;

        return this.api.get<TeamDto[]>('/api/teams', { params: filteredParams });
    }

    get(id: number) {
        return this.api.get<TeamDto>(`/api/teams/${encodeURIComponent(String(id))}`);
    }

    create(payload: TeamCreatePayload) {
        return this.api.post<TeamDto>('/api/teams', payload);
    }

    update(id: number, payload: TeamUpdatePayload) {
        return this.api.put<TeamDto>(`/api/teams/${encodeURIComponent(String(id))}`, payload);
    }

    remove(id: number) {
        return this.api.delete<{ ok: boolean }>(`/api/teams/${encodeURIComponent(String(id))}`);
    }

    listPlayers(teamId: number, params?: { search?: string; limit?: number | string }) {
        const p: Record<string, string> = {};
        if (params?.search) p['search'] = String(params.search);
        if (params?.limit != null && params.limit !== '') p['limit'] = String(params.limit);
        return this.api.get<TeamPlayerDto[]>(
            `/api/teams/${encodeURIComponent(String(teamId))}/players`,
            { params: p },
        );
    }

    addPlayer(teamId: number, userId: number) {
        return this.api.post<{ teamId: number; userId: number }>(
            `/api/teams/${encodeURIComponent(String(teamId))}/players`,
            { userId },
        );
    }

    addPlayersBulk(teamId: number, userIds: number[]) {
        return this.api.post<{ requested: number; created: number; skipped: number }>(
            `/api/teams/${encodeURIComponent(String(teamId))}/players/bulk`,
            { userIds },
        );
    }

    removePlayer(teamId: number, userId: number) {
        return this.api.delete<void>(
            `/api/teams/${encodeURIComponent(String(teamId))}/players/${encodeURIComponent(String(userId))}`,
        );
    }
}
