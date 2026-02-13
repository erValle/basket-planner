export type AdminUserRole = 'admin' | 'technical_director' | 'coach' | 'player' | 'user';
export type AdminUserStatus = 'active' | 'inactive';

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
    password?: string;
    role?: AdminUserRole;
    status: AdminUserStatus;
}
