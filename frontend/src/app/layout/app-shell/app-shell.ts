import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

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
		const items = this.navItems.filter((i) => i.group === 'general' && this.hasAccess(i));
		console.log('[AppShell] generalNav items:', items.map(i => i.route), 'role:', this.auth.getRoleSnapshot());
		return items;
	}

	get controlNav() {
		return this.navItems.filter((i) => i.group === 'control' && this.hasAccess(i));
	}

	// Responsive navigation
	isMobileNavOpen = false;

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
		// Cargar clubs disponibles
		this.clubContext.refresh();
		
		// Suscribirse a cambios de club para mantener el select sincronizado
		this.clubContext.selectedClubId$.subscribe((clubId) => {
			this.selectedClubId = clubId;
		});
	}

	getPanelLabel(): string {
		const role = this.auth.getRoleSnapshot();
		if (role === 'player') return 'Panel jugador';
		if (role === 'admin') return 'Panel administrador';
		return 'Panel entrenador';
	}
}
