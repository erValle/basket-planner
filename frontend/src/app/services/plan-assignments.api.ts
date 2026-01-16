import { Injectable } from '@angular/core';
import { ApiClient } from './api-client';

export interface PlanAssignment {
  id: number;
  userId: number;
  trainingPlanId: number;
  assignedAt: string;
  startDate?: string;
  endDate?: string;
  status: 'assigned' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  trainingPlan?: any;
  user?: any;
}

@Injectable({ providedIn: 'root' })
export class PlanAssignmentsApiService {
  constructor(private readonly api: ApiClient) {}

  /**
   * Get all assignments for a specific user
   * Backend: GET /api/plan-assignments/user/:userId
   */
  listAssignmentsForUser(userId: string | number) {
    return this.api.get<PlanAssignment[]>(
      `/api/plan-assignments/user/${encodeURIComponent(userId)}`
    );
  }

  /**
   * Get all assignments for a training plan
   * Backend: GET /api/plan-assignments/training-plan/:trainingPlanId
   */
  listAssignmentsForPlan(trainingPlanId: string | number) {
    return this.api.get<PlanAssignment[]>(
      `/api/plan-assignments/training-plan/${encodeURIComponent(trainingPlanId)}`
    );
  }

  /**
   * Get a specific assignment
   * Backend: GET /api/plan-assignments/:id
   */
  getAssignment(id: string | number) {
    return this.api.get<PlanAssignment>(
      `/api/plan-assignments/${encodeURIComponent(id)}`
    );
  }

  /**
   * Create a new assignment
   * Backend: POST /api/plan-assignments
   */
  createAssignment(payload: Partial<PlanAssignment>) {
    return this.api.post<PlanAssignment>('/api/plan-assignments', payload);
  }

  /**
   * Update an assignment
   * Backend: PUT /api/plan-assignments/:id
   */
  updateAssignment(id: string | number, payload: Partial<PlanAssignment>) {
    return this.api.put<PlanAssignment>(
      `/api/plan-assignments/${encodeURIComponent(id)}`,
      payload
    );
  }

  /**
   * Delete an assignment
   * Backend: DELETE /api/plan-assignments/:id
   */
  deleteAssignment(id: string | number) {
    return this.api.delete(`/api/plan-assignments/${encodeURIComponent(id)}`);
  }
}
