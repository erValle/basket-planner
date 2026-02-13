import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { PageHeader } from '../components/page-header/page-header';
import { AppShell } from '../layout/app-shell/app-shell';
import { BpDialog } from '../components/bp-dialog';

import { FeedbackApiService } from '../services/feedback.api';
import {
    FeedbackSurveyAnswers,
    FeedbackVersionAnswers,
    FeedbackSurveyListItem,
} from '../models/feedback-survey';

@Component({
    selector: 'app-session-detail',
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        RouterLink,
        ButtonModule,
        BpDialog,
        TextareaModule,
        TagModule,
        SelectModule,
        ToastModule,
        PageHeader,
        AppShell,
    ],
    templateUrl: './session-detail.html',
    styleUrl: './session-detail.scss',
    providers: [MessageService],
})
export class SessionDetail {
    // Mock data - in production, this would come from route params + API
    session = {
        id: 's1',
        title: 'Sesión · Senior Masculino',
        date: '2025-12-28',
        durationMin: 90,
        status: 'completada' as const,
        objective: 'Mejorar transiciones ofensivas y rebote defensivo.',
        // Add these for feedback functionality
        trainingPlanVersionId: 1, // Would come from route/API
        sessionId: 'MON-2026-01-06', // Would come from route/API
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
    canFeedback = false;
    feedbackCheckLoading = false;

    scale1to10 = Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));
    scale0to10 = Array.from({ length: 11 }, (_, i) => ({ label: String(i), value: i }));
    scale1to5 = Array.from({ length: 5 }, (_, i) => ({ label: String(i + 1), value: i + 1 }));

    draftSurvey: FeedbackVersionAnswers = {
        overall: 5,
        physicalEffort: 5,
        technicalEffort: 5,
        mentalEffort: 5,
        notes: '',
    };

    constructor(
        private readonly feedbackApi: FeedbackApiService,
        private readonly toast: MessageService,
    ) {}

    ngOnInit(): void {
        // Check if user can provide feedback for this session
        this.checkFeedbackPermission();
    }

    checkFeedbackPermission(): void {
        if (!this.session.trainingPlanVersionId) {
            return;
        }

        this.feedbackCheckLoading = true;
        this.feedbackApi.canProvideFeedback(this.session.trainingPlanVersionId).subscribe({
            next: (result) => {
                this.canFeedback = result.canFeedback;
                this.feedbackCheckLoading = false;
            },
            error: (err) => {
                console.error('Error checking feedback permission:', err);
                this.canFeedback = false;
                this.feedbackCheckLoading = false;
            },
        });
    }

    get canRegisterFeedback(): boolean {
        return this.canFeedback && this.session.status === 'completada';
    }

    openFeedback(): void {
        if (!this.canRegisterFeedback) {
            this.toast.add({
                severity: 'info',
                summary: 'No disponible',
                detail: 'No tienes permisos para dar feedback a esta sesión o no está completada.',
            });
            return;
        }
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
            a.overall == null ||
            a.physicalEffort == null ||
            a.technicalEffort == null ||
            a.mentalEffort == null;
        if (isMissing) {
            this.toast.add({
                severity: 'warn',
                summary: 'Revisa el formulario',
                detail: 'Completa todas las escalas.',
            });
            return;
        }

        this.savingFeedback = true;

        // Create payload for version feedback (not session-specific)
        const payload: any = {
            targetId: String(this.session.trainingPlanVersionId),
            targetType: 'version',
            answers: this.draftSurvey,
        };

        this.feedbackApi.createSurvey(payload).subscribe({
            next: (result) => {
                this.savingFeedback = false;

                // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
                setTimeout(() => {
                    this.feedbackDialogVisible = false;
                });

                this.toast.add({
                    severity: 'success',
                    summary: 'Guardado',
                    detail: 'Tu feedback ha sido registrado correctamente.',
                });

                // Update the latest survey with the newly created feedback
                this.latestSurvey = {
                    id: String(result.id),
                    playerId: String(result.userId),
                    targetType: 'version',
                    targetId: String(result.trainingPlanVersionId),
                    createdAt: result.createdAt || new Date().toISOString(),
                    answers: this.draftSurvey,
                };

                // Reset form
                this.draftSurvey = {
                    overall: 5,
                    physicalEffort: 5,
                    technicalEffort: 5,
                    mentalEffort: 5,
                    notes: '',
                };
            },
            error: (err) => {
                this.savingFeedback = false;
                console.error('Error saving feedback:', err);
                this.toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail:
                        err.error?.message || 'No se pudo guardar el feedback. Inténtalo de nuevo.',
                });
            },
        });
    }
}
