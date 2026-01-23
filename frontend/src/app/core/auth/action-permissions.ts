import { Role } from './roles';

/**
 * Define permissions for specific actions (CRUD operations)
 * This allows granular control over what each role can do
 */

export type Action = 'create' | 'edit' | 'delete' | 'view' | 'assign' | 'export';

export interface ActionPermissions {
	[key: string]: Role[];
}

/**
 * Permissions for each resource and action
 * Format: 'resource.action': ['role1', 'role2']
 */
export const ACTION_PERMISSIONS: ActionPermissions = {
	// Clubs
	'clubs.create': ['admin'],
	'clubs.edit': ['admin'],
	'clubs.delete': ['admin'],
	'clubs.view': ['admin', 'technical_director'],

	// Teams
	'teams.create': ['admin', 'technical_director'],
	'teams.edit': ['admin', 'technical_director', 'coach'],
	'teams.delete': ['admin', 'technical_director'],
	'teams.view': ['admin', 'technical_director', 'coach'],
	'teams.manage_players': ['admin', 'technical_director', 'coach'],

	// Players
	'players.create': ['admin', 'technical_director'],
	'players.edit': ['admin', 'technical_director', 'coach'],
	'players.delete': ['admin', 'technical_director'],
	'players.view': ['admin', 'technical_director', 'coach'],
	'players.transfer': ['admin', 'technical_director'],

	// Exercises
	'exercises.create': ['admin', 'technical_director', 'coach'],
	'exercises.edit': ['admin', 'technical_director', 'coach'],
	'exercises.delete': ['admin', 'technical_director', 'coach'],
	'exercises.view': ['admin', 'technical_director', 'coach'],

	// Material/Equipment
	'equipment.create': ['admin', 'technical_director', 'coach'],
	'equipment.edit': ['admin', 'technical_director', 'coach'],
	'equipment.delete': ['admin', 'technical_director'],
	'equipment.view': ['admin', 'technical_director', 'coach'],

	// Training Plans
	'planning.create': ['admin', 'technical_director', 'coach'],
	'planning.edit': ['admin', 'technical_director', 'coach'],
	'planning.delete': ['admin', 'technical_director', 'coach'],
	'planning.view': ['admin', 'technical_director', 'coach', 'player'],
	'planning.assign': ['admin', 'technical_director', 'coach'],
	'planning.export': ['admin', 'technical_director', 'coach'],

	// Users (Admin section)
	'users.create': ['admin'],
	'users.edit': ['admin'],
	'users.delete': ['admin'],
	'users.view': ['admin'],
	'users.reset_password': ['admin'],

	// Monitoring
	'monitoring.view': ['admin'],

	// Audit
	'audit.view': ['admin'],
};

/**
 * Check if a role has permission to perform an action on a resource
 * @param role - User's role
 * @param resource - Resource name (e.g., 'clubs', 'teams', 'planning')
 * @param action - Action to perform (e.g., 'create', 'edit', 'delete')
 * @returns true if the role has permission
 */
export function hasActionPermission(
	role: Role | null | undefined,
	resource: string,
	action: Action
): boolean {
	if (!role) return false;
	
	const key = `${resource}.${action}`;
	const allowedRoles = ACTION_PERMISSIONS[key];
	
	if (!allowedRoles) {
		// If no specific permission is defined, deny access
		return false;
	}
	
	return allowedRoles.includes(role);
}

/**
 * Check multiple permissions at once
 * @param role - User's role
 * @param permissions - Array of permission keys (e.g., ['clubs.create', 'clubs.edit'])
 * @returns true if the role has ALL specified permissions
 */
export function hasAllPermissions(
	role: Role | null | undefined,
	permissions: string[]
): boolean {
	if (!role) return false;
	
	return permissions.every(permission => {
		const allowedRoles = ACTION_PERMISSIONS[permission];
		return allowedRoles && allowedRoles.includes(role);
	});
}

/**
 * Check if the role has ANY of the specified permissions
 * @param role - User's role
 * @param permissions - Array of permission keys
 * @returns true if the role has at least ONE of the specified permissions
 */
export function hasAnyPermission(
	role: Role | null | undefined,
	permissions: string[]
): boolean {
	if (!role) return false;
	
	return permissions.some(permission => {
		const allowedRoles = ACTION_PERMISSIONS[permission];
		return allowedRoles && allowedRoles.includes(role);
	});
}
