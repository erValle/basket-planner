export type PlayerMembershipStatus = 'active' | 'closed';

export interface PlayerMembership {
  id: string;
  playerId: string;
  clubId: number;
  clubName?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  isPrimary: boolean;
  status: PlayerMembershipStatus;
}

export interface PlayerMembershipListResponse {
  items: PlayerMembership[];
}

export interface PlayerMembershipCreatePayload {
  clubId: number;
  startDate: string;
  isPrimary?: boolean;
}

export interface PlayerMembershipClosePayload {
  endDate: string;
}

export interface PlayerMembershipSetPrimaryPayload {
  membershipId: string;
}

export interface PlayerTransferPayload {
  newClubId: number;
  transferDate: string; // YYYY-MM-DD
}
