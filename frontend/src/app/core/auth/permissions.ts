import { Role } from './roles';

export interface NavItem {
	key: string;
	label: string;
	route: string;
	roles: Role[];
	icon?: string;
	group?: 'general' | 'control';
}

export const NAV_ITEMS: NavItem[] = [
	{ key: 'dashboard', label: 'Dashboard', route: '/dashboard', roles: ['admin', 'coach', 'staff'], icon: 'pi pi-home', group: 'general' },
	{ key: 'player', label: 'Mi panel', route: '/player', roles: ['admin', 'coach', 'staff', 'player'], icon: 'pi pi-id-card', group: 'general' },
	{ key: 'player-planning', label: 'Mis planificaciones', route: '/player/planning', roles: ['player'], icon: 'pi pi-calendar', group: 'general' },
	{ key: 'planning', label: 'Planificaciones', route: '/planning', roles: ['admin', 'coach', 'staff'], icon: 'pi pi-calendar', group: 'general' },
	{ key: 'planning-new', label: 'Nueva planificación', route: '/planning/new', roles: ['admin', 'coach'], icon: 'pi pi-plus', group: 'general' },
	{ key: 'players', label: 'Jugadores', route: '/players', roles: ['admin', 'coach', 'staff'], icon: 'pi pi-users', group: 'general' },
	{ key: 'exercises', label: 'Ejercicios', route: '/exercises', roles: ['admin', 'coach', 'staff'], icon: 'pi pi-book', group: 'general' },
	{ key: 'clubs', label: 'Clubes', route: '/clubs', roles: ['admin', 'coach', 'staff'], icon: 'pi pi-building', group: 'general' },
	{ key: 'teams', label: 'Equipos', route: '/teams', roles: ['admin', 'coach', 'staff'], icon: 'pi pi-sitemap', group: 'general' },
	{ key: 'material', label: 'Material', route: '/material', roles: ['admin', 'coach', 'staff'], icon: 'pi pi-box', group: 'general' },

	{ key: 'recommender', label: 'Recomendador', route: '/recommender', roles: ['admin', 'coach'], icon: 'pi pi-sparkles', group: 'control' },
	{ key: 'monitoring', label: 'Monitorización', route: '/monitoring', roles: ['admin'], icon: 'pi pi-wrench', group: 'control' },
	{ key: 'admin-users', label: 'Admin / Usuarios', route: '/admin/users', roles: ['admin'], icon: 'pi pi-users', group: 'control' },
	{ key: 'audit', label: 'Auditoría', route: '/audit', roles: ['admin'], icon: 'pi pi-shield', group: 'control' },
];

/**
 * Route patterns used for authorization.
 * - Use exact paths for simple routes.
 * - Use parameter placeholders in the same shape as Angular route config.
 */
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
	'/dashboard': ['admin', 'coach', 'staff'],
	'/player': ['admin', 'coach', 'staff', 'player'],
	'/player/planning': ['admin', 'coach', 'staff', 'player'],
	'/player/no-plannings': ['admin', 'coach', 'staff', 'player'],

	'/planning': ['admin', 'coach', 'staff'],
	'/planning/new': ['admin', 'coach'],
	'/planning/:id': ['admin', 'coach', 'staff', 'player'],
	'/planning/:id/edit': ['admin', 'coach'],

	'/players': ['admin', 'coach', 'staff'],
	'/exercises': ['admin', 'coach', 'staff'],
	'/exercises/new': ['admin', 'coach'],
	'/clubs': ['admin', 'coach', 'staff'],
	'/clubs/new': ['admin'],
	'/teams': ['admin', 'coach', 'staff'],
	'/teams/new': ['admin'],
	'/material': ['admin', 'coach', 'staff'],
	'/material/new': ['admin', 'coach'],

	'/recommender': ['admin', 'coach'],
	'/monitoring': ['admin'],
	'/audit': ['admin'],
	'/admin/users': ['admin'],
	'/admin/users/new': ['admin'],
	'/admin/users/:id': ['admin'],
};

export function canAccess(role: Role | null | undefined, rolesAllowed: Role[] | null | undefined): boolean {
	if (!rolesAllowed || rolesAllowed.length === 0) return true;
	if (!role) return false;
	return rolesAllowed.includes(role);
}

export function resolveAllowedRolesFromUrl(url: string): Role[] | null {
	// Normalize: remove query and hash
	const clean = url.split('?')[0].split('#')[0];

	// Try exact match first
	if (ROUTE_PERMISSIONS[clean]) return ROUTE_PERMISSIONS[clean];

	// Try pattern match by comparing path segments
	const urlSegs = clean.split('/').filter(Boolean);

	for (const pattern of Object.keys(ROUTE_PERMISSIONS)) {
		const patSegs = pattern.split('/').filter(Boolean);
		if (patSegs.length !== urlSegs.length) continue;

		let matches = true;
		for (let i = 0; i < patSegs.length; i++) {
			const p = patSegs[i];
			const u = urlSegs[i];
			if (p.startsWith(':')) continue;
			if (p !== u) {
				matches = false;
				break;
			}
		}
		if (matches) return ROUTE_PERMISSIONS[pattern];
	}

	return null;
}
