export type Role = 'admin' | 'technical_director' | 'coach' | 'player' | 'user';

export const ROLE_LABELS: Record<Role, string> = {
    admin: 'Admin',
    technical_director: 'Director Técnico',
    coach: 'Coach',
    player: 'Jugador',
    user: 'Usuario',
};

export function hasRole(
    userRole: Role | null | undefined,
    allowedRoles: Role[] | null | undefined,
): boolean {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (!userRole) return false;
    return allowedRoles.includes(userRole);
}
