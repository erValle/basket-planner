import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ROUTE_PERMISSIONS } from './core/auth/permissions';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./pages/login').then((m) => m.Login),
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
        children: [
            // Redirección inteligente según rol del usuario
            {
                path: '',
                pathMatch: 'full',
                loadComponent: () => import('./pages/home-redirect').then((m) => m.HomeRedirect),
            },

            // Dashboard - Solo Director Técnico y Entrenador
            {
                path: 'dashboard',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/dashboard'] },
                loadComponent: () => import('./pages/dashboard').then((m) => m.Dashboard),
            },

            // Usuario nuevo (registro por admin)
            {
                path: 'users/new',
                loadComponent: () => import('./pages/new-user').then((m) => m.NewUser),
            },

            // Planificaciones - Director Técnico y Entrenador
            {
                path: 'planning',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/planning'] },
                loadComponent: () => import('./pages/planning').then((m) => m.Planning),
            },
            {
                path: 'planning/new',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/planning/new'] },
                loadComponent: () =>
                    import('./pages/new-planification').then((m) => m.NewPlanification),
            },
            {
                path: 'planning/:id',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/planning/:id'] },
                loadComponent: () =>
                    import('./pages/planning-detail').then((m) => m.PlanningDetail),
            },
            {
                path: 'planning/:id/edit',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/planning/:id/edit'] },
                loadComponent: () => import('./pages/planning-edit').then((m) => m.PlanningEdit),
            },
            {
                path: 'planning/session',
                loadComponent: () => import('./pages/session-detail').then((m) => m.SessionDetail),
            },

            // Jugadores - Director Técnico y Entrenador
            {
                path: 'players',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/players'] },
                loadComponent: () => import('./pages/players').then((m) => m.Players),
            },

            // Panel de Jugador
            {
                path: 'player',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/player'] },
                loadComponent: () =>
                    import('./pages/player-dashboard').then((m) => m.PlayerDashboard),
            },
            {
                path: 'player/planning',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/player/planning'] },
                loadComponent: () =>
                    import('./pages/player-planning').then((m) => m.PlayerPlanningPage),
            },
            {
                path: 'player/no-plannings',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/player'] },
                loadComponent: () =>
                    import('./pages/player-no-plannings').then((m) => m.PlayerNoPlanningsPage),
            },

            // Monitorización - Solo Admin
            {
                path: 'monitoring',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/monitoring'] },
                loadComponent: () => import('./pages/monitoring').then((m) => m.Monitoring),
            },

            // Ejercicios - Director Técnico y Entrenador
            {
                path: 'exercises',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/exercises'] },
                loadComponent: () => import('./pages/exercises').then((m) => m.Exercises),
            },
            {
                path: 'exercises/new',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/exercises/new'] },
                loadComponent: () => import('./pages/new-exercise').then((m) => m.NewExercise),
            },

            // Clubes - Solo Admin
            {
                path: 'clubs',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/clubs'] },
                loadComponent: () => import('./pages/clubs').then((m) => m.Clubs),
            },
            {
                path: 'clubs/new',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/clubs/new'] },
                loadComponent: () => import('./pages/new-club').then((m) => m.NewClub),
            },

            // Equipos - Solo Director Técnico
            {
                path: 'teams',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/teams'] },
                loadComponent: () => import('./pages/teams').then((m) => m.Teams),
            },
            {
                path: 'teams/new',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/teams/new'] },
                loadComponent: () => import('./pages/new-team').then((m) => m.NewTeam),
            },
            {
                path: 'teams/:id',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/teams'] },
                loadComponent: () => import('./pages/team-detail').then((m) => m.TeamDetail),
            },

            // Material - Solo Director Técnico
            {
                path: 'material',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/material'] },
                loadComponent: () => import('./pages/material').then((m) => m.Material),
            },
            {
                path: 'material/new',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/material/new'] },
                loadComponent: () => import('./pages/new-material').then((m) => m.NewMaterial),
            },

            // Admin - Gestión de usuarios (Solo Admin)
            {
                path: 'admin/users',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/admin/users'] },
                loadComponent: () => import('./pages/admin-users').then((m) => m.AdminUsers),
            },
            {
                path: 'audit',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/audit'] },
                loadComponent: () => import('./pages/audit').then((m) => m.AuditPage),
            },
            {
                path: 'admin/users/new',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/admin/users/new'] },
                loadComponent: () => import('./pages/admin-user-form').then((m) => m.AdminUserForm),
            },
            {
                path: 'admin/users/:id',
                canActivate: [roleGuard],
                data: { roles: ROUTE_PERMISSIONS['/admin/users/:id'] },
                loadComponent: () => import('./pages/admin-user-form').then((m) => m.AdminUserForm),
            },
            {
                path: 'forbidden',
                loadComponent: () => import('./pages/forbidden').then((m) => m.ForbiddenPage),
            },
        ],
    },
    {
        path: 'not-found',
        loadComponent: () => import('./pages/not-found').then((m) => m.NotFoundPage),
    },
    { path: '**', redirectTo: 'not-found' },
];
