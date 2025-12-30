export type AdminUserRole = 'admin' | 'coach' | 'staff' | 'player';
export type AdminUserStatus = 'active' | 'blocked' | 'pending';

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  createdAt: string; // ISO date
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  createdAt: string;
}

export interface AdminUserListParams {
  search?: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  page?: number;
  pageSize?: number;
}

export interface AdminUserListResponse {
  items: AdminUserListItem[];
  total: number;
}

export interface AdminUserUpsertPayload {
  name: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
}
