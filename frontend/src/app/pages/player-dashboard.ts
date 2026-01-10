import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { PageHeader } from '../components/page-header/page-header';
import { AppShell } from '../layout/app-shell/app-shell';
import { FeedbackApiService } from '../services/feedback.api';
import { FeedbackSurveyListItem, FeedbackSurveyWeeklyAggregate } from '../models/feedback-survey';
import { PlanAssignmentsApiService, PlanAssignment } from '../services/plan-assignments.api';
import { UserContextService } from '../core/auth/user-context.service';

@Component({
  selector: 'app-player-dashboard',
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, TagModule, ProgressSpinnerModule, PageHeader, AppShell],
  templateUrl: './player-dashboard.html',
  styleUrl: './player-dashboard.css',
})
export class PlayerDashboard {
  readonly playerName = 'Jugador';
  readonly playerSubtitle = 'Resumen';

  feedbackLoading = false;
  feedbackError: string | null = null;
  recentSurveys: FeedbackSurveyListItem[] = [];
  weeklyAggregates: FeedbackSurveyWeeklyAggregate[] = [];

  // Plan assignments
  assignmentsLoading = false;
  assignmentsError: string | null = null;
  assignments: PlanAssignment[] = [];

  constructor(
    private readonly feedbackApi: FeedbackApiService,
    private readonly planAssignmentsApi: PlanAssignmentsApiService,
    private readonly userContext: UserContextService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadAssignments();
  }

  loadAssignments(): void {
    const user = this.userContext.getUserSnapshot();
    
    if (!user?.id) {
      this.assignmentsError = 'No se pudo obtener el ID del usuario actual.';
      return;
    }

    this.assignmentsLoading = true;
    this.assignmentsError = null;
    this.assignments = []; // Reset assignments

    this.planAssignmentsApi.listAssignmentsForUser(user.id).subscribe({
      next: (data) => {
        this.assignmentsLoading = false;
        
        // Ensure we have an array
        if (Array.isArray(data)) {
          this.assignments = data;
        } else {
          this.assignments = data ? [data] : [];
        }
        
        // Force change detection
        this.cdr.detectChanges();
      },
      error: (e: unknown) => {
        this.assignmentsLoading = false;
        const errorMessage = e instanceof Error ? e.message : 
                            (e as any)?.error?.message || 
                            (e as any)?.message || 
                            'No se pudieron cargar las planificaciones asignadas.';
        this.assignmentsError = errorMessage;
        this.assignments = [];
      },
    });
  }

  loadFeedback(): void {
    this.feedbackLoading = false;
    this.recentSurveys = [];
    this.weeklyAggregates = [];
    this.feedbackError = 'Aún no disponible: falta endpoint para resolver el jugador actual.';
  }

  private weekKey(d: Date): string {
    // ISO week key (approx): YYYY-Www. Good enough for frontend-only stub.
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  private computeWeeklyAggregates(items: FeedbackSurveyListItem[]): FeedbackSurveyWeeklyAggregate[] {
    const groups = new Map<string, FeedbackSurveyListItem[]>();
    for (const it of items) {
      const key = this.weekKey(new Date(it.createdAt));
      groups.set(key, [...(groups.get(key) ?? []), it]);
    }
    const out: FeedbackSurveyWeeklyAggregate[] = [];
    for (const [week, list] of groups.entries()) {
      const count = list.length;
      const avg = (vals: number[]) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined);
      out.push({
        week,
        count,
        avgRpe: avg(list.map((x) => x.answers.rpe)),
        avgFatigue: avg(list.map((x) => x.answers.fatigue)),
        avgPain: avg(list.map((x) => x.answers.pain)),
        avgSleep: avg(list.map((x) => x.answers.sleep)),
        avgStress: avg(list.map((x) => x.answers.stress)),
        avgMood: avg(list.map((x) => x.answers.mood)),
      });
    }
    return out.sort((a, b) => (a.week < b.week ? 1 : -1));
  }

}
