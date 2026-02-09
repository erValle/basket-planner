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
    // === ADMIN: Solo acceso a gestión de sistema ===
    {
        key: 'admin-users',
        label: 'Admin / Usuarios',
        route: '/admin/users',
        roles: ['admin'],
        icon: 'pi pi-users',
        group: 'control',
    },
    {
        key: 'clubs',
        label: 'Clubes',
        route: '/clubs',
        roles: ['admin'],
        icon: 'pi pi-building',
        group: 'control',
    },
    {
        key: 'monitoring',
        label: 'Monitorización',
        route: '/monitoring',
        roles: ['admin'],
        icon: 'pi pi-sparkles',
        group: 'control',
    },
    {
        key: 'audit',
        label: 'Auditoría',
        route: '/audit',
        roles: ['admin'],
        icon: 'pi pi-shield',
        group: 'control',
    },

    // === DIRECTOR TÉCNICO: Gestión de equipos, material + funciones de entrenador ===
    {
        key: 'dashboard',
        label: 'Dashboard',
        route: '/dashboard',
        roles: ['technical_director', 'coach'],
        icon: 'pi pi-home',
        group: 'general',
    },
    {
        key: 'teams',
        label: 'Equipos',
        route: '/teams',
        roles: ['technical_director'],
        icon: 'pi pi-sitemap',
        group: 'general',
    },
    {
        key: 'material',
        label: 'Material',
        route: '/material',
        roles: ['technical_director'],
        icon: 'pi pi-box',
        group: 'general',
    },

    // === ENTRENADOR (y Director Técnico heredado): Planificaciones y ejercicios ===
    {
        key: 'planning',
        label: 'Planificaciones',
        route: '/planning',
        roles: ['technical_director', 'coach'],
        icon: 'pi pi-calendar',
        group: 'general',
    },
    {
        key: 'planning-new',
        label: 'Nueva planificación',
        route: '/planning/new',
        roles: ['technical_director', 'coach'],
        icon: 'pi pi-plus',
        group: 'general',
    },
    {
        key: 'players',
        label: 'Jugadores',
        route: '/players',
        roles: ['technical_director', 'coach'],
        icon: 'pi pi-users',
        group: 'general',
    },
    {
        key: 'exercises',
        label: 'Ejercicios',
        route: '/exercises',
        roles: ['technical_director', 'coach'],
        icon: 'pi pi-book',
        group: 'general',
    },

    // === JUGADOR: Solo su panel y planificaciones asignadas ===
    {
        key: 'player',
        label: 'Mi panel',
        route: '/player',
        roles: ['player'],
        icon: 'pi pi-id-card',
        group: 'general',
    },
    {
        key: 'player-planning',
        label: 'Mis planificaciones',
        route: '/player/planning',
        roles: ['player'],
        icon: 'pi pi-calendar',
        group: 'general',
    },
];

/**
 * Route patterns used for authorization.
 * - Use exact paths for simple routes.
 * - Use parameter placeholders in the same shape as Angular route config.
 *
 * Permisos según alcance:
 * - Admin: usuarios, clubes, auditoría, monitorización
 * - Director Técnico: equipos, material + funciones de entrenador
 * - Entrenador: planificaciones, ejercicios
 * - Jugador: sus planificaciones asignadas y feedback
 */
export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
    // === DASHBOARD ===
    '/dashboard': ['technical_director', 'coach'],

    // === JUGADOR ===
    '/player': ['player'],
    '/player/planning': ['player'],
    '/player/no-plannings': ['player'],

    // === PLANIFICACIONES (Entrenador + Director Técnico) ===
    '/planning': ['technical_director', 'coach'],
    '/planning/new': ['technical_director', 'coach'],
    '/planning/:id': ['technical_director', 'coach', 'player'],
    '/planning/:id/edit': ['technical_director', 'coach'],

    // === JUGADORES (lectura: Entrenador + Director Técnico) ===
    '/players': ['technical_director', 'coach'],

    // === EJERCICIOS (Entrenador + Director Técnico) ===
    '/exercises': ['technical_director', 'coach'],
    '/exercises/new': ['technical_director', 'coach'],

    // === CLUBES (Solo Admin) ===
    '/clubs': ['admin'],
    '/clubs/new': ['admin'],

    // === EQUIPOS (Solo Director Técnico) ===
    '/teams': ['technical_director'],
    '/teams/new': ['technical_director'],
    '/teams/:id': ['technical_director'],

    // === MATERIAL (Solo Director Técnico) ===
    '/material': ['technical_director'],
    '/material/new': ['technical_director'],

    // === ADMINISTRACIÓN (Solo Admin) ===
    '/monitoring': ['admin'],
    '/audit': ['admin'],
    '/admin/users': ['admin'],
    '/admin/users/new': ['admin'],
    '/admin/users/:id': ['admin'],
};

export function canAccess(
    role: Role | null | undefined,
    rolesAllowed: Role[] | null | undefined,
): boolean {
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
