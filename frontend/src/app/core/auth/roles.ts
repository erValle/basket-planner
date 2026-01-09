export type Role = 'admin' | 'technical_director' | 'coach' | 'staff' | 'player';

export const ROLE_LABELS: Record<Role, string> = {
	admin: 'Admin',
	technical_director: 'Director Técnico',
	coach: 'Coach',
	staff: 'Staff',
	player: 'Jugador',
};

export function hasRole(userRole: Role | null | undefined, allowedRoles: Role[] | null | undefined): boolean {
	if (!allowedRoles || allowedRoles.length === 0) return true;
	if (!userRole) return false;
	return allowedRoles.includes(userRole);
}
