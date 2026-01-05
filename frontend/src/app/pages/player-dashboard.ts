import { Component } from '@angular/core';
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

@Component({
  selector: 'app-player-dashboard',
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, TagModule, ProgressSpinnerModule, PageHeader, AppShell],
  templateUrl: './player-dashboard.html',
  styleUrl: './player-dashboard.css',
})
export class PlayerDashboard {
  // Honest UI: aún no existe endpoint para cargar el perfil del jugador autenticado y sus métricas.
  // Mantenemos el dashboard centrado en encuestas reales (FeedbackApiService) cuando estén disponibles.
  readonly playerName = 'Jugador';
  readonly playerSubtitle = 'Resumen';

  feedbackLoading = false;
  feedbackError: string | null = 'Aún no disponible: falta endpoint para resolver el jugador actual.';
  recentSurveys: FeedbackSurveyListItem[] = [];
  weeklyAggregates: FeedbackSurveyWeeklyAggregate[] = [];

  constructor(private readonly feedbackApi: FeedbackApiService) {}

  ngOnInit(): void {
    // Por ahora no llamamos a feedbackApi porque esta pantalla no tiene forma de resolver el playerId real.
    // Cuando exista un endpoint tipo `/api/me` o `/api/players/me`, podremos obtener el id real.
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
