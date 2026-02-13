import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { AppShell } from '../layout/app-shell/app-shell';

@Component({
    selector: 'app-not-found',
    imports: [CommonModule, RouterLink, ButtonModule, AppShell],
    templateUrl: './not-found.html',
    styleUrl: './not-found.scss',
})
export class NotFoundPage {}
