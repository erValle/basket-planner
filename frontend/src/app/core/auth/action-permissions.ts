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
 *
 * Según alcance de la aplicación:
 * - Admin: registrar usuarios, CRUD clubes, auditoría, monitorización
 * - Director Técnico: CRUD equipos, asignar jugadores, transferencias, gestionar material
 * - Entrenador: planificaciones, ejercicios, ver feedback
 * - Jugador: ver sesiones, crear/editar/ver feedback propio
 */
export const ACTION_PERMISSIONS: ActionPermissions = {
    // === CLUBES (Solo Admin) ===
    'clubs.create': ['admin'],
    'clubs.edit': ['admin'],
    'clubs.delete': ['admin'],
    'clubs.view': ['admin'],

    // === EQUIPOS (Solo Director Técnico) ===
    'teams.create': ['technical_director'],
    'teams.edit': ['technical_director'],
    'teams.delete': ['technical_director'],
    'teams.view': ['technical_director', 'coach'], // Coach puede ver pero no editar
    'teams.manage_players': ['technical_director'], // Solo Director Técnico asigna jugadores

    // === JUGADORES ===
    'players.create': ['admin', 'technical_director'], // Admin crea usuarios, Director Técnico puede añadir jugadores al club
    'players.edit': ['technical_director'], // Solo Director Técnico edita perfiles de jugador
    'players.delete': ['admin'],
    'players.view': ['technical_director', 'coach'],
    'players.transfer': ['technical_director'], // Solo Director Técnico puede transferir

    // === EJERCICIOS (Entrenador + Director Técnico) ===
    'exercises.create': ['technical_director', 'coach'],
    'exercises.edit': ['technical_director', 'coach'],
    'exercises.delete': ['technical_director', 'coach'], // Desactivar
    'exercises.view': ['technical_director', 'coach', 'player'],

    // === MATERIAL/EQUIPMENT (Solo Director Técnico) ===
    'equipment.create': ['technical_director'],
    'equipment.edit': ['technical_director'],
    'equipment.delete': ['technical_director'],
    'equipment.view': ['technical_director', 'coach'], // Coach puede ver pero no editar

    // === PLANIFICACIONES (Entrenador + Director Técnico) ===
    'planning.create': ['technical_director', 'coach'],
    'planning.edit': ['technical_director', 'coach'],
    'planning.delete': ['technical_director', 'coach'],
    'planning.view': ['technical_director', 'coach', 'player'],
    'planning.assign': ['technical_director', 'coach'],
    'planning.export': ['technical_director', 'coach', 'player'],

    // === FEEDBACK ===
    'feedback.create': ['technical_director', 'coach', 'player'],
    'feedback.edit': ['technical_director', 'coach', 'player'], // Jugador puede editar su propio feedback
    'feedback.delete': ['technical_director'],
    'feedback.view': ['technical_director', 'coach', 'player'],

    // === USUARIOS (Solo Admin) ===
    'users.create': ['admin'],
    'users.edit': ['admin'],
    'users.delete': ['admin'],
    'users.view': ['admin'],
    'users.reset_password': ['admin'],

    // === MONITORIZACIÓN (Solo Admin) ===
    'monitoring.view': ['admin'],

    // === AUDITORÍA (Solo Admin) ===
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
    action: Action,
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
export function hasAllPermissions(role: Role | null | undefined, permissions: string[]): boolean {
    if (!role) return false;

    return permissions.every((permission) => {
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
export function hasAnyPermission(role: Role | null | undefined, permissions: string[]): boolean {
    if (!role) return false;

    return permissions.some((permission) => {
        const allowedRoles = ACTION_PERMISSIONS[permission];
        return allowedRoles && allowedRoles.includes(role);
    });
}
