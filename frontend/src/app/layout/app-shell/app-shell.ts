import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { NotificationsApiService } from '../../services/notifications.api';
import { AppNotification, NotificationType } from '../../models/notification';
import { AuthService } from '../../core/auth/auth.service';
import { ROLE_LABELS, Role } from '../../core/auth/roles';
import { NAV_ITEMS, canAccess } from '../../core/auth/permissions';
import { ClubContextService } from '../../core/context/club-context.service';

export type AppShellNavItem = {
	label: string;
	route: string;
	group: 'general' | 'control';
	icon?: string;
	roles?: Role[];
};

@Component({
	selector: 'app-shell',
	standalone: true,
	imports: [CommonModule, AsyncPipe, RouterLink, RouterLinkActive, FormsModule, SelectModule, ButtonModule, ToastModule],
	templateUrl: './app-shell.html',
	styleUrl: './app-shell.scss',
	providers: [MessageService],
})
export class AppShell implements OnInit {
	private readonly notificationsApi = inject(NotificationsApiService);
	private readonly toast = inject(MessageService);
	private readonly auth = inject(AuthService);
	private readonly clubContext = inject(ClubContextService);

	@Input({ required: true }) title = '';
	@Input() subtitle = '';

	@Input() navItems: AppShellNavItem[] = [
		...NAV_ITEMS
			.filter((x) => x.group === 'general' || x.group === 'control')
			.map((x) => ({
				label: x.label,
				route: x.route,
				group: (x.group ?? 'general') as 'general' | 'control',
				icon: x.icon,
				roles: x.roles,
			})),
	];

	private hasAccess(item: AppShellNavItem): boolean {
		return canAccess(this.auth.getRoleSnapshot(), item.roles);
	}

	get generalNav() {
		return this.navItems.filter((i) => i.group === 'general' && this.hasAccess(i));
	}

	get controlNav() {
		return this.navItems.filter((i) => i.group === 'control' && this.hasAccess(i));
	}

	// Responsive navigation
	isMobileNavOpen = false;

	// Notifications
	notificationsOpen = false;
	notificationsLoading = false;
	notificationsError: string | null = null;
	notifications: AppNotification[] = [];

	// Club selector
	readonly clubOptions$ = this.clubContext.clubs$;
	selectedClubId: number | null = this.clubContext.getSelectedClubIdSnapshot();

	get showClubSelector(): boolean {
		const role = this.auth.getRoleSnapshot();
		return role === 'admin' || role === 'coach';
	}

	onClubChange(value: number | null): void {
		if (value == null) return;
		this.selectedClubId = value;
		this.clubContext.setSelectedClubId(value);
	}

	get currentUserName(): string {
		return this.auth.getSession()?.user?.name ?? 'Usuario';
	}

	get currentRoleLabel(): string {
		const role = this.auth.getRoleSnapshot();
		return role ? ROLE_LABELS[role] : '—';
	}

	logout(): void {
		this.auth.logout();
	}

	toggleMobileNav(): void {
		this.isMobileNavOpen = !this.isMobileNavOpen;
	}

	closeMobileNav(): void {
		this.isMobileNavOpen = false;
	}

	ngOnInit(): void {
		this.loadNotifications();
	}

	toggleNotifications(): void {
		this.notificationsOpen = !this.notificationsOpen;
		if (this.notificationsOpen) this.loadNotifications();
	}

	closeNotifications(): void {
		this.notificationsOpen = false;
	}

	loadNotifications(): void {
		this.notificationsLoading = true;
		this.notificationsError = null;

		this.notificationsApi.list().subscribe({
			next: (res) => {
				this.notificationsLoading = false;
				this.notifications = Array.isArray(res?.items) ? res.items : [];
			},
			error: (e: unknown) => {
				this.notificationsLoading = false;
				const msg = e instanceof Error ? e.message : 'No se pudieron cargar las notificaciones.';
				this.notificationsError = msg;
				this.toast.add({ severity: 'error', summary: 'Notificaciones', detail: msg });
			},
		});
	}

	get unreadCount(): number {
		return this.notifications.filter((n) => !n.read).length;
	}

	markRead(n: AppNotification): void {
		if (n.read) return;
		this.notificationsApi.markRead(n.id).subscribe({
			next: () => {
				this.notifications = this.notifications.map((x) => (x.id === n.id ? { ...x, read: true } : x));
			},
			error: (e: unknown) => {
				const msg = e instanceof Error ? e.message : 'No se pudo marcar como leída.';
				this.toast.add({ severity: 'error', summary: 'Notificaciones', detail: msg });
			},
		});
	}

	markAllRead(): void {
		this.notificationsApi.markAllRead().subscribe({
			next: () => {
				this.notifications = this.notifications.map((x) => ({ ...x, read: true }));
				this.toast.add({ severity: 'success', summary: 'Notificaciones', detail: 'Todas marcadas como leídas.' });
			},
			error: (e: unknown) => {
				const msg = e instanceof Error ? e.message : 'No se pudo marcar todas como leídas.';
				this.toast.add({ severity: 'error', summary: 'Notificaciones', detail: msg });
			},
		});
	}

	notificationSeverity(t: NotificationType): 'success' | 'info' | 'warn' | 'danger' {
		return t;
	}

	formatIso(iso: string): string {
		try {
			const d = new Date(iso);
			return isNaN(d.getTime()) ? iso : d.toLocaleString();
		} catch {
			return iso;
		}
	}

	getPanelLabel(): string {
		const role = this.auth.getRoleSnapshot();
		if (role === 'player') return 'Panel jugador';
		if (role === 'admin') return 'Panel administrador';
		return 'Panel entrenador';
	}
}
