import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

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
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        ButtonModule,
        TagModule,
        ProgressSpinnerModule,
        PageHeader,
        AppShell,
    ],
    templateUrl: './player-dashboard.html',
    styleUrl: './player-dashboard.scss',
})
export class PlayerDashboard implements OnInit, OnDestroy {
    readonly playerSubtitle = 'Resumen';

    get playerName(): string {
        return this.userContext.getUserSnapshot()?.name ?? 'Jugador';
    }

    feedbackLoading = false;
    feedbackError: string | null = null;
    recentSurveys: FeedbackSurveyListItem[] = [];
    weeklyAggregates: FeedbackSurveyWeeklyAggregate[] = [];

    // Plan assignments
    assignmentsLoading = false;
    assignmentsError: string | null = null;
    assignments: PlanAssignment[] = [];

    /** Dashboard muestra máximo 5 planificaciones */
    readonly maxDashboardAssignments = 5;

    get displayedAssignments(): PlanAssignment[] {
        return this.assignments.slice(0, this.maxDashboardAssignments);
    }

    get hasMoreAssignments(): boolean {
        return this.assignments.length > this.maxDashboardAssignments;
    }

    private routerSubscription?: Subscription;

    constructor(
        private readonly feedbackApi: FeedbackApiService,
        private readonly planAssignmentsApi: PlanAssignmentsApiService,
        private readonly userContext: UserContextService,
        private readonly cdr: ChangeDetectorRef,
        private readonly router: Router,
    ) {}

    ngOnInit(): void {
        this.loadAssignments();
        this.loadFeedback();

        // Subscribe to router events to reload data when navigating back to this page
        this.routerSubscription = this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe((event: any) => {
                if (event.urlAfterRedirects === '/player/dashboard') {
                    this.loadAssignments();
                    this.loadFeedback();
                }
            });
    }

    ngOnDestroy(): void {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
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
                this.cdr.markForCheck();
            },
            error: (e: unknown) => {
                this.assignmentsLoading = false;
                const errorMessage =
                    e instanceof Error
                        ? e.message
                        : (e as any)?.error?.message ||
                          (e as any)?.message ||
                          'No se pudieron cargar las planificaciones asignadas.';
                this.assignmentsError = errorMessage;
                this.assignments = [];
                this.cdr.markForCheck();
            },
        });
    }

    loadFeedback(): void {
        const user = this.userContext.getUserSnapshot();

        if (!user?.id) {
            this.feedbackError = 'No se pudo obtener el ID del usuario actual.';
            return;
        }

        this.feedbackLoading = true;
        this.feedbackError = null;
        this.recentSurveys = [];
        this.weeklyAggregates = [];

        this.feedbackApi.listRecentForPlayer(String(user.id), 10).subscribe({
            next: (response) => {
                this.feedbackLoading = false;
                this.recentSurveys = response.items || [];
                this.weeklyAggregates = this.computeWeeklyAggregates(this.recentSurveys);
                this.cdr.markForCheck();
            },
            error: (e: unknown) => {
                this.feedbackLoading = false;
                const errorMessage =
                    e instanceof Error
                        ? e.message
                        : (e as any)?.error?.message ||
                          (e as any)?.message ||
                          'No se pudo cargar el historial de feedback.';
                this.feedbackError = errorMessage;
                this.recentSurveys = [];
                this.weeklyAggregates = [];
                this.cdr.markForCheck();
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

    private computeWeeklyAggregates(
        items: FeedbackSurveyListItem[],
    ): FeedbackSurveyWeeklyAggregate[] {
        const groups = new Map<string, FeedbackSurveyListItem[]>();
        for (const it of items) {
            const key = this.weekKey(new Date(it.createdAt));
            groups.set(key, [...(groups.get(key) ?? []), it]);
        }
        const out: FeedbackSurveyWeeklyAggregate[] = [];
        for (const [week, list] of groups.entries()) {
            const count = list.length;
            const avg = (vals: number[]) =>
                vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined;
            out.push({
                week,
                count,
                avgOverall: avg(list.map((x) => (x.answers as any).overall)),
                avgPhysicalEffort: avg(list.map((x) => (x.answers as any).physicalEffort)),
                avgTechnicalEffort: avg(list.map((x) => (x.answers as any).technicalEffort)),
                avgMentalEffort: avg(list.map((x) => (x.answers as any).mentalEffort)),
            });
        }
        return out.sort((a, b) => (a.week < b.week ? 1 : -1));
    }
}
