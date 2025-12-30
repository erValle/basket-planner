import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';

@Component({
	selector: 'app-new-exercise',
	standalone: true,
	imports: [CommonModule, ButtonModule, AppShell, PageHeader],
	templateUrl: './new-exercise.html',
	styleUrl: './new-exercise.css'
})
export class NewExercise {
	teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
	selectedTeam: string | null = this.teamsTop[0];

	constructor(private readonly router: Router) {}

	goToExercises() {
		this.router.navigateByUrl('/exercises');
	}

	cancel() {
		this.router.navigateByUrl('/dashboard');
	}
}
