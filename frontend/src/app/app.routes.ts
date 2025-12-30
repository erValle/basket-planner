import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () => import('./pages/login').then((m) => m.Login)
	},
	{
		path: '',
		loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
		children: [
			{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
			{ path: 'dashboard', loadComponent: () => import('./pages/dashboard').then((m) => m.Dashboard) },
			{ path: 'users/new', loadComponent: () => import('./pages/new-user').then((m) => m.NewUser) },
			{ path: 'planning', loadComponent: () => import('./pages/planning').then((m) => m.Planning) },
			{ path: 'planning/new', loadComponent: () => import('./pages/new-planification').then((m) => m.NewPlanification) },
			{ path: 'planning/:id', loadComponent: () => import('./pages/planning-detail').then((m) => m.PlanningDetail) },
			{ path: 'planning/:id/edit', loadComponent: () => import('./pages/planning-edit').then((m) => m.PlanningEdit) },
			{ path: 'planning/session', loadComponent: () => import('./pages/session-detail').then((m) => m.SessionDetail) },
			{ path: 'players', loadComponent: () => import('./pages/players').then((m) => m.Players) },
			{ path: 'player', loadComponent: () => import('./pages/player-dashboard').then((m) => m.PlayerDashboard) },
			{ path: 'monitoring', loadComponent: () => import('./pages/monitoring').then((m) => m.Monitoring) },
			{
				path: 'recommender',
				canActivate: [authGuard, roleGuard],
				data: { roles: ['ADMIN', 'TRAINER'] },
				loadComponent: () => import('./pages/recommender').then((m) => m.RecommenderPage),
			},
			{ path: 'exercises', loadComponent: () => import('./pages/exercises').then((m) => m.Exercises) },
			{ path: 'exercises/new', loadComponent: () => import('./pages/new-exercise').then((m) => m.NewExercise) },
			{ path: 'clubs', loadComponent: () => import('./pages/clubs').then((m) => m.Clubs) },
			{ path: 'clubs/new', loadComponent: () => import('./pages/new-club').then((m) => m.NewClub) },
			{ path: 'teams', loadComponent: () => import('./pages/teams').then((m) => m.Teams) },
			{ path: 'teams/new', loadComponent: () => import('./pages/new-team').then((m) => m.NewTeam) },
			{ path: 'material', loadComponent: () => import('./pages/material').then((m) => m.Material) },
			{ path: 'material/new', loadComponent: () => import('./pages/new-material').then((m) => m.NewMaterial) },

			// Admin (frontend-only guards)
			{
				path: 'admin/users',
				canActivate: [authGuard, roleGuard],
				data: { roles: ['ADMIN'] },
				loadComponent: () => import('./pages/admin-users').then((m) => m.AdminUsers),
			},
			{
				path: 'audit',
				canActivate: [authGuard, roleGuard],
				data: { roles: ['ADMIN'] },
				loadComponent: () => import('./pages/audit').then((m) => m.AuditPage),
			},
			{
				path: 'admin/users/new',
				canActivate: [authGuard, roleGuard],
				data: { roles: ['ADMIN'] },
				loadComponent: () => import('./pages/admin-user-form').then((m) => m.AdminUserForm),
			},
			{
				path: 'admin/users/:id',
				canActivate: [authGuard, roleGuard],
				data: { roles: ['ADMIN'] },
				loadComponent: () => import('./pages/admin-user-form').then((m) => m.AdminUserForm),
			},
		]
	},
	{ path: '**', redirectTo: '' }
];
