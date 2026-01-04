import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { AppShell } from '../layout/app-shell/app-shell';
import { ClubContextService } from '../core/context/club-context.service';
import { PlanningApiService } from '../services/planning.api';
import { PlanningListItem, PlanningStatus } from '../models/planning';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, FormsModule, ButtonModule, SelectModule, AppShell],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly clubContext = inject(ClubContextService);
  private readonly planningApi = inject(PlanningApiService);
  private readonly router = inject(Router);

  readonly selectedClubName = computed(() => {
    const clubId = this.clubContext.getSelectedClubIdSnapshot();
    if (clubId == null) return null;
    const clubs = this.clubContext.getClubsSnapshot();
    return clubs.find((c) => Number(c.id) === Number(clubId))?.name ?? null;
  });

  planningModeOptions: Array<{ label: string; value: 'individual' | 'group' }> = [
    { label: 'Individual', value: 'individual' },
    { label: 'Grupal', value: 'group' },
  ];

  selectedPlanningMode: 'individual' | 'group' = 'individual';

  loadingPlannings = false;
  planningsError: string | null = null;
  latestPlannings: PlanningListItem[] = [];

  ngOnInit(): void {
    this.loadLatestPlannings();
  }

  private toUiPlanning(p: any): PlanningListItem {
    return {
      id: String(p?.id ?? ''),
      date: (p?.createdAt ? String(p.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10)),
      team: p?.targetType === 'group' ? 'Equipo' : 'Individual',
      objective: p?.name ? String(p.name) : 'Plan',
      status: ((['draft', 'generated', 'published', 'archived'] as string[]).includes(String(p?.status))
        ? String(p.status)
        : 'draft') as PlanningStatus,
      version: p?.activeVersionId != null ? `v${p.activeVersionId}` : 'v1',
      author: p?.createdById != null ? `user:${p.createdById}` : '-',
    };
  }

  loadLatestPlannings(): void {
    this.loadingPlannings = true;
    this.planningsError = null;

    // Honest UI: backend list doesn't support upcoming-by-date yet, so we show the latest N.
    this.planningApi
      .list({ status: undefined, page: 1, pageSize: 5 })
      .subscribe({
        next: (res: any) => {
          this.loadingPlannings = false;
          if (Array.isArray(res)) this.latestPlannings = res.map((p: any) => this.toUiPlanning(p));
          else this.latestPlannings = [];
        },
        error: (e: unknown) => {
          this.loadingPlannings = false;
          this.planningsError = e instanceof Error ? e.message : 'No se pudieron cargar las planificaciones.';
          this.latestPlannings = [];
        },
      });
  }

  viewPlanning(p: PlanningListItem): void {
    if (!p?.id) return;
    this.router.navigate(['/planning', p.id]);
  }

  statusLabel(s: PlanningStatus): string {
    switch (s) {
      case 'draft':
        return 'Borrador';
      case 'generated':
        return 'Generada';
      case 'published':
        return 'Publicada';
      case 'archived':
        return 'Archivada';
    }
  }
}
