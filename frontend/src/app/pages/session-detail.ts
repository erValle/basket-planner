import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { PageHeader } from '../components/page-header/page-header';
import { AppShell } from '../layout/app-shell/app-shell';

import { FeedbackApiService } from '../services/feedback.api';
import { FeedbackSurveyAnswers, FeedbackSurveyListItem } from '../models/feedback-survey';

@Component({
  selector: 'app-session-detail',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RouterLink,
    ButtonModule,
    DialogModule,
    TextareaModule,
    TagModule,
    SelectModule,
    ToastModule,
    PageHeader,
    AppShell,
  ],
  templateUrl: './session-detail.html',
  styleUrl: './session-detail.css',
  providers: [MessageService],
})
export class SessionDetail {
  teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam = this.teamsTop[0];

  session = {
    id: 's1',
    title: 'Sesión · Senior Masculino',
    date: '2025-12-28',
    durationMin: 90,
    status: 'completada' as const,
    objective: 'Mejorar transiciones ofensivas y rebote defensivo.',
  };

  blocks = [
    {
      id: 'b1',
      name: 'Calentamiento',
      durationMin: 15,
      focus: 'Movilidad + activación',
      notes: 'RPE objetivo 4/10',
    },
    {
      id: 'b2',
      name: 'Parte principal',
      durationMin: 60,
      focus: 'Transición 3v2 + 4v3, rebote y 5v5',
      notes: 'Controlar carga y pausas',
    },
    {
      id: 'b3',
      name: 'Vuelta a la calma',
      durationMin: 15,
      focus: 'Estiramientos + respiración',
      notes: 'Recuperación activa',
    },
  ];

  feedbackDialogVisible = false;

  savingFeedback = false;
  latestSurvey: FeedbackSurveyListItem | null = null;

  scale1to10 = Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));
  scale0to10 = Array.from({ length: 11 }, (_, i) => ({ label: String(i), value: i }));
  scale1to5 = Array.from({ length: 5 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));

  draftSurvey: FeedbackSurveyAnswers = {
    rpe: 5,
    fatigue: 5,
    pain: 0,
    sleep: 3,
    stress: 3,
    mood: 3,
    notes: '',
  };

  constructor(private readonly feedbackApi: FeedbackApiService, private readonly toast: MessageService) {}

  openFeedback(): void {
    this.feedbackDialogVisible = true;
  }

	closeFeedback(): void {
		this.feedbackDialogVisible = false;
	}

  saveFeedback(): void {
    if (this.savingFeedback) return;

    // Basic validation
    const a = this.draftSurvey;
    const isMissing =
      a.rpe == null || a.fatigue == null || a.pain == null || a.sleep == null || a.stress == null || a.mood == null;
    if (isMissing) {
      this.toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'Completa todas las escalas.' });
      return;
    }

    this.savingFeedback = true;
    this.feedbackApi
      .createSurvey({
        playerId: 'p1',
        targetType: 'session',
        targetId: this.session.id,
        answers: this.draftSurvey,
      })
      .subscribe({
        next: (res) => {
          this.savingFeedback = false;
          this.feedbackDialogVisible = false;
          const createdAt = new Date().toISOString();
          this.latestSurvey = {
            id: res?.id ?? `fs-${Math.random().toString(16).slice(2)}`,
            playerId: 'p1',
            targetType: 'session',
            targetId: this.session.id,
            createdAt,
            answers: { ...this.draftSurvey },
          };
          this.toast.add({ severity: 'success', summary: 'Guardado', detail: 'Encuesta registrada (stub).' });
        },
        error: (e: unknown) => {
          this.savingFeedback = false;
          const msg = e instanceof Error ? e.message : 'No se pudo guardar el feedback.';
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
  }
}
