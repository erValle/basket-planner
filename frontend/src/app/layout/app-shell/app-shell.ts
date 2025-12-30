import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';

export type AppShellNavItem = {
	label: string;
	route: string;
	group: 'general' | 'control';
	icon?: string;
};

@Component({
	selector: 'app-shell',
	standalone: true,
	imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, SelectModule, ButtonModule],
	templateUrl: './app-shell.html',
	styleUrl: './app-shell.css',
})
export class AppShell {
	@Input({ required: true }) title = '';
	@Input() subtitle = '';

	@Input() teams: string[] = [];
	@Input() selectedTeam: string | null = null;
	@Output() selectedTeamChange = new EventEmitter<string | null>();
	@Input() showTeamSelect = true;

	onSelectedTeamChange(value: string | null): void {
		this.selectedTeam = value;
		this.selectedTeamChange.emit(value);
	}

	@Input() navItems: AppShellNavItem[] = [
		{ label: 'Dashboard', route: '/dashboard', group: 'general', icon: 'pi pi-home' },
		{ label: 'Planificaciones', route: '/planning/new', group: 'general', icon: 'pi pi-calendar' },
		{ label: 'Jugadores', route: '/players', group: 'general', icon: 'pi pi-users' },
		{ label: 'Ejercicios', route: '/exercises', group: 'general', icon: 'pi pi-book' },
		{ label: 'Clubes', route: '/clubs', group: 'general', icon: 'pi pi-building' },
		{ label: 'Equipos', route: '/teams', group: 'general', icon: 'pi pi-sitemap' },
		{ label: 'Material', route: '/material', group: 'general', icon: 'pi pi-box' },
		{ label: 'Monitorización IA', route: '/monitoring', group: 'control', icon: 'pi pi-wrench' },
	];

	get generalNav() {
		return this.navItems.filter((i) => i.group === 'general');
	}

	get controlNav() {
		return this.navItems.filter((i) => i.group === 'control');
	}

	// Responsive navigation
	isMobileNavOpen = false;

	toggleMobileNav(): void {
		this.isMobileNavOpen = !this.isMobileNavOpen;
	}

	closeMobileNav(): void {
		this.isMobileNavOpen = false;
	}
}
