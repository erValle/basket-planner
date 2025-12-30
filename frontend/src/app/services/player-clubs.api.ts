import { Injectable } from '@angular/core';

import { ApiClient } from './api-client';
import {
  PlayerMembership,
  PlayerMembershipClosePayload,
  PlayerMembershipCreatePayload,
  PlayerMembershipListResponse,
  PlayerTransferPayload,
} from '../models/player-memberships';

@Injectable({ providedIn: 'root' })
export class PlayerClubsApiService {
  constructor(private readonly api: ApiClient) {}

  listMemberships(playerId: string) {
    return this.api.get<PlayerMembershipListResponse>(
      `/api/players/${encodeURIComponent(playerId)}/memberships`,
    );
  }

  createMembership(playerId: string, payload: PlayerMembershipCreatePayload) {
    return this.api.post<{ id: string }>(
      `/api/players/${encodeURIComponent(playerId)}/memberships`,
      payload,
    );
  }

  closeMembership(playerId: string, membershipId: string, payload: PlayerMembershipClosePayload) {
    return this.api.post<{ ok: boolean }>(
      `/api/players/${encodeURIComponent(playerId)}/memberships/${encodeURIComponent(membershipId)}/close`,
      payload,
    );
  }

  setPrimary(playerId: string, membershipId: string) {
    return this.api.post<{ ok: boolean }>(
      `/api/players/${encodeURIComponent(playerId)}/memberships/${encodeURIComponent(membershipId)}/primary`,
      {},
    );
  }

  transfer(playerId: string, payload: PlayerTransferPayload) {
    return this.api.post<{ ok: boolean }>(
      `/api/players/${encodeURIComponent(playerId)}/transfer`,
      payload,
    );
  }

  // Optional delete endpoint (contract ready if needed later)
  removeMembership(playerId: string, membershipId: string) {
    return this.api.delete<{ ok: boolean }>(
      `/api/players/${encodeURIComponent(playerId)}/memberships/${encodeURIComponent(membershipId)}`,
    );
  }
}
