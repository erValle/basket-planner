import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { AppShell } from '../layout/app-shell/app-shell';
import { PlanningApiService } from '../services/planning.api';
import { UserContextService } from '../core/auth/user-context.service';

/**
 * Player-facing planning entry point.
 * - If assigned plannings exist: redirects to the first planning detail.
 * - If none exist: redirects to /player/no-plannings.
 *
 * Frontend-only: assignment logic is stubbed and currently uses a safe fallback.
 */
@Component({
  selector: 'app-player-planning',
  imports: [CommonModule, ButtonModule, ProgressSpinnerModule, AppShell],
  templateUrl: './player-planning.html',
  styleUrl: './player-planning.css',
})
export class PlayerPlanningPage {
  loading = false;
  error: string | null = null;

  constructor(
    private readonly api: PlanningApiService,
    private readonly router: Router,
    private readonly userContext: UserContextService,
  ) {}

  ngOnInit(): void {
    this.resolvePlanning();
  }

  private resolvePlanning(): void {
    this.loading = true;
    this.error = null;

    // Frontend-only assumption: player sees only assigned plannings.
    // Until backend exists, we try to load plannings and decide by empty/non-empty.
    // If endpoint fails, default to “no plannings” to avoid an empty page.
    this.api.list({ page: 1, pageSize: 10 }).subscribe({
      next: (res) => {
        this.loading = false;
        const items = res?.items && Array.isArray(res.items) ? res.items : [];

        if (items.length === 0) {
          void this.router.navigateByUrl('/player/no-plannings');
          return;
        }

        // Redirect to first planning detail (read-only).
        void this.router.navigateByUrl(`/planning/${encodeURIComponent(items[0].id)}`);
      },
      error: () => {
        this.loading = false;
        // Conservative fallback: show the “no plannings” page.
        void this.router.navigateByUrl('/player/no-plannings');
      },
    });
  }
}
