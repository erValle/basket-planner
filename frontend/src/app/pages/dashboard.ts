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
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, RouterLink, FormsModule, ButtonModule, SelectModule, AppShell],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss',
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

    private readonly refreshPlannings$ = new BehaviorSubject<void>(undefined);

    readonly planningsVm$ = this.refreshPlannings$.pipe(
        startWith(undefined),
        switchMap(() =>
            this.planningApi.list({ status: undefined, page: 1, pageSize: 5 }).pipe(
                map((res: any) => {
                    const items = Array.isArray(res)
                        ? res.map((p: any) => this.toUiPlanning(p))
                        : [];
                    return { loading: false as const, error: null as string | null, latest: items };
                }),
                startWith({
                    loading: true as const,
                    error: null as string | null,
                    latest: [] as PlanningListItem[],
                }),
                catchError((e: unknown) => {
                    const msg =
                        e instanceof Error
                            ? e.message
                            : 'No se pudieron cargar las planificaciones.';
                    return of({
                        loading: false as const,
                        error: msg,
                        latest: [] as PlanningListItem[],
                    });
                }),
            ),
        ),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    ngOnInit(): void {
        this.loadLatestPlannings();
    }

    private toUiPlanning(p: any): PlanningListItem {
        const targetType = p?.targetType === 'group' ? 'group' : 'individual';

        // Determinar assignedTo basado en el tipo
        let assignedTo = '';
        if (targetType === 'individual') {
            const firstAssignment = p?.assignments?.[0];
            if (firstAssignment?.user) {
                const user = firstAssignment.user;
                assignedTo =
                    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                    user.email ||
                    'Sin asignar';
            } else {
                assignedTo = 'Sin asignar';
            }
        } else {
            const firstAssignment = p?.assignments?.[0];
            const firstClub = firstAssignment?.user?.userClubs?.[0]?.club;
            if (firstClub) {
                assignedTo = `Grupal ${firstClub.name}`;
            } else {
                assignedTo = 'Grupal';
            }
        }

        // Obtener nombre del autor
        let authorName = '-';
        if (p?.createdBy) {
            authorName =
                `${p.createdBy.firstName || ''} ${p.createdBy.lastName || ''}`.trim() ||
                `user:${p.createdById}`;
        } else if (p?.createdById) {
            authorName = `user:${p.createdById}`;
        }

        return {
            id: String(p?.id ?? ''),
            date: p?.createdAt
                ? String(p.createdAt).slice(0, 10)
                : new Date().toISOString().slice(0, 10),
            name: p?.name ? String(p.name) : 'Sin nombre',
            targetType,
            assignedTo,
            status: ((['draft', 'active', 'archived'] as string[]).includes(String(p?.status))
                ? String(p.status)
                : 'draft') as PlanningStatus,
            version: p?.activeVersionId != null ? `v${p.activeVersionId}` : 'v1',
            author: authorName,
        };
    }

    loadLatestPlannings(): void {
        this.refreshPlannings$.next();
    }

    viewPlanning(p: PlanningListItem): void {
        if (!p?.id) return;
        this.router.navigate(['/planning', p.id]);
    }

    statusLabel(s: PlanningStatus): string {
        switch (s) {
            case 'draft':
                return 'Borrador';
            case 'active':
                return 'Activa';
            case 'archived':
                return 'Archivada';
            default:
                return 'Desconocido';
        }
    }
}
