import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';
import { PlanAssignmentsApiService, PlanAssignment } from '../services/plan-assignments.api';
import { UserContextService } from '../core/auth/user-context.service';
import { PlanningStatus } from '../models/planning';

/**
 * Player-facing planning list view.
 * Shows all planifications assigned to the current player.
 */
@Component({
  selector: 'app-player-planning',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ProgressSpinnerModule,
    TableModule,
    TagModule,
    InputTextModule,
    PageHeader,
    AppShell,
  ],
  templateUrl: './player-planning.html',
  styleUrl: './player-planning.css',
})
export class PlayerPlanningPage {
  // Signals para estado reactivo
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  assignments = signal<PlanAssignment[]>([]);
  searchText = signal<string>('');

  // Computed signal para filtrado reactivo
  filteredAssignments = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    if (!search) {
      return this.assignments();
    }

    return this.assignments().filter(a => 
      a.trainingPlan?.name?.toLowerCase().includes(search) ||
      a.trainingPlan?.description?.toLowerCase().includes(search) ||
      a.trainingPlan?.goal?.toLowerCase().includes(search)
    );
  });

  constructor(
    private readonly planAssignmentsApi: PlanAssignmentsApiService,
    private readonly router: Router,
    private readonly userContext: UserContextService,
  ) {}

  ngOnInit(): void {
    this.loadAssignments();
  }

  loadAssignments(): void {
    const user = this.userContext.getUserSnapshot();
    
    if (!user?.id) {
      this.error.set('No se pudo obtener el usuario actual');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.planAssignmentsApi.listAssignmentsForUser(user.id).subscribe({
      next: (assignments) => {
        this.loading.set(false);
        this.assignments.set(assignments || []);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e instanceof Error ? e.message : 'Error al cargar las planificaciones');
      },
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      active: 'Activa',
      archived: 'Archivada',
    };
    return labels[status] || status;
  }

  statusSeverity(status: string): 'secondary' | 'success' | 'info' | 'warn' | 'danger' {
    const severities: Record<string, 'secondary' | 'success' | 'info' | 'warn' | 'danger'> = {
      draft: 'secondary',
      active: 'success',
      archived: 'info',
    };
    return severities[status] || 'secondary';
  }

  assignmentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      assigned: 'Asignada',
      active: 'Activa',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  }

  assignmentStatusSeverity(status: string): 'secondary' | 'success' | 'info' | 'warn' | 'danger' {
    const severities: Record<string, 'secondary' | 'success' | 'info' | 'warn' | 'danger'> = {
      assigned: 'info',
      active: 'success',
      completed: 'info',
      cancelled: 'danger',
    };
    return severities[status] || 'secondary';
  }

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  viewPlanning(assignment: PlanAssignment): void {
    if (assignment.trainingPlanId) {
      void this.router.navigateByUrl(`/planning/${assignment.trainingPlanId}`);
    }
  }
}
