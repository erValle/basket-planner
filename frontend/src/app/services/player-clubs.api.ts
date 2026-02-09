import { Injectable } from '@angular/core';

import { ApiClient } from './api-client';
import {
    PlayerMembership,
    PlayerMembershipClosePayload,
    PlayerMembershipCreatePayload,
    PlayerMembershipListResponse,
    PlayerTransferPayload,
} from '../models/player-memberships';

export interface PlayerHistoryRow {
    id: number | string;
    userId: number;
    clubId: number;
    isPrimary: boolean;
    startDate: string;
    endDate?: string | null;
    club?: { id: number; name: string } | null;
}

@Injectable({ providedIn: 'root' })
export class PlayerClubsApiService {
    constructor(private readonly api: ApiClient) {}

    /**
     * Preferred source for memberships (CU015). Includes club name when available.
     */
    getPlayerHistory(userId: string) {
        return this.api.get<PlayerHistoryRow[]>(
            `/api/players/${encodeURIComponent(userId)}/history`,
        );
    }

    listMemberships(userId: string) {
        return this.api.get<PlayerMembershipListResponse>(`/api/user-clubs`, {
            params: { userId: encodeURIComponent(userId) },
        });
    }

    createMembership(userId: string, payload: PlayerMembershipCreatePayload & { clubId?: number }) {
        // Backend expects numeric userId/clubId.
        return this.api.post<any>(`/api/user-clubs`, {
            userId: Number(userId),
            clubId: Number((payload as any).clubId),
            isPrimary: !!payload.isPrimary,
            startDate: payload.startDate,
        });
    }

    closeMembership(membershipId: string, payload: PlayerMembershipClosePayload) {
        return this.api.put<any>(`/api/user-clubs/${encodeURIComponent(membershipId)}`, {
            endDate: payload.endDate,
            isPrimary: false,
        });
    }

    setPrimary(membershipId: string) {
        return this.api.put<any>(`/api/user-clubs/${encodeURIComponent(membershipId)}`, {
            isPrimary: true,
        });
    }

    transfer(userId: string, payload: PlayerTransferPayload & { newClubId?: number }) {
        // Dedicated backend endpoint (transactional): closes current primary + creates the new one.
        return this.api.post<any>(`/api/players/${encodeURIComponent(userId)}/transfer`, {
            clubId: Number((payload as any).newClubId),
            startDate: payload.transferDate,
            closePreviousAt: payload.transferDate,
            makePrimary: true,
        });
    }

    removeMembership(membershipId: string) {
        return this.api.delete<void>(`/api/user-clubs/${encodeURIComponent(membershipId)}`);
    }
}
