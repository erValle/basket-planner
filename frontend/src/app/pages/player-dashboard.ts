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
	teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
	selectedTeam = this.teamsTop[0];

  player = {
    id: 'p8',
    name: 'Jugador #8',
    position: 'Escolta',
    status: 'activo' as const,
  };

  metrics = [
    { id: 'm1', label: 'Carga semanal', value: 78, hint: 'Objetivo 60–75', severity: 'warn' as const },
    { id: 'm2', label: 'Sueño', value: 6.2, hint: 'Horas promedio', severity: 'info' as const },
    { id: 'm3', label: 'Dolor', value: 2, hint: '0–10', severity: 'success' as const },
  ];

  feedbackLoading = false;
  feedbackError: string | null = null;
  recentSurveys: FeedbackSurveyListItem[] = [];
  weeklyAggregates: FeedbackSurveyWeeklyAggregate[] = [];

  constructor(private readonly feedbackApi: FeedbackApiService) {}

  ngOnInit(): void {
    this.loadFeedback();
  }

  loadFeedback(): void {
    this.feedbackLoading = true;
    this.feedbackError = null;
    this.feedbackApi.listRecentForPlayer(this.player.id, 12).subscribe({
      next: (res) => {
        this.feedbackLoading = false;
        const items = res?.items && Array.isArray(res.items) ? res.items : this.buildMockSurveys();
        // Newest first
        this.recentSurveys = [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6);
        this.weeklyAggregates = this.computeWeeklyAggregates(items).slice(0, 4);
      },
      error: (e: unknown) => {
        this.feedbackLoading = false;
        this.feedbackError = e instanceof Error ? e.message : 'No se pudo cargar el feedback.';
      },
    });
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

  private buildMockSurveys(): FeedbackSurveyListItem[] {
    const now = new Date();
    const iso = (d: Date) => d.toISOString();
    return [
      {
        id: 'fs-1',
        playerId: this.player.id,
        targetType: 'session',
        targetId: 's1',
        createdAt: iso(new Date(now.getTime() - 2 * 86400000)),
        answers: { rpe: 7, fatigue: 7, pain: 2, sleep: 3, stress: 2, mood: 4, notes: 'Piernas cargadas.' },
      },
      {
        id: 'fs-2',
        playerId: this.player.id,
        targetType: 'session',
        targetId: 's0',
        createdAt: iso(new Date(now.getTime() - 1 * 86400000)),
        answers: { rpe: 6, fatigue: 5, pain: 1, sleep: 4, stress: 2, mood: 5, notes: '' },
      },
      {
        id: 'fs-3',
        playerId: this.player.id,
        targetType: 'planning',
        targetId: 'pl-1',
        createdAt: iso(now),
        answers: { rpe: 8, fatigue: 8, pain: 3, sleep: 2, stress: 4, mood: 3, notes: 'Semana exigente.' },
      },
    ];
  }
}
