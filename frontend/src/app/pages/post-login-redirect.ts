import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { AuthService } from '../core/auth/auth.service';
import { AppShell } from '../layout/app-shell/app-shell';

/**
 * Centralized landing redirect after authentication.
 * This prevents players from being redirected to /dashboard (forbidden).
 */
@Component({
  selector: 'app-post-login-redirect',
  imports: [CommonModule, ProgressSpinnerModule, AppShell],
  templateUrl: './post-login-redirect.html',
  styleUrl: './post-login-redirect.css',
})
export class PostLoginRedirectPage {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const role = this.auth.getRoleSnapshot();
    void this.router.navigateByUrl(role === 'player' ? '/player' : '/dashboard');
  }
}
