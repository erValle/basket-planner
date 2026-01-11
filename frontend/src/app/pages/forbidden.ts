import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { AppShell } from '../layout/app-shell/app-shell';

@Component({
	selector: 'app-forbidden',
	imports: [CommonModule, RouterLink, ButtonModule, AppShell],
	templateUrl: './forbidden.html',
	styleUrl: './forbidden.scss',
})
export class ForbiddenPage {
}
