import { Injectable, inject } from '@angular/core';

import { ApiClient } from './api-client';

export type ExerciseType = 'cardio' | 'strength' | 'flexibility' | 'balance';

export interface ExerciseDto {
  id: number;
  name: string;
  type: ExerciseType;
  difficulty: Record<string, unknown>;
  duration: number;
  description?: string | null;
  tags?: string[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedExercisesResponse {
  exercises: ExerciseDto[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface CreateExerciseDto {
  name: string;
  type: ExerciseType;
  difficulty: Record<string, unknown>;
  duration: number;
  description?: string | null;
  tags?: string[];
  active?: boolean;
}

export interface UpdateExerciseDto {
  name?: string;
  type?: ExerciseType;
  difficulty?: Record<string, unknown>;
  duration?: number;
  description?: string | null;
  tags?: string[];
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ExercisesApi {
  private readonly api = inject(ApiClient);

  list(params?: { search?: string; type?: string; active?: string; page?: number; pageSize?: number }) {
    // Si se envían page/pageSize, el backend devuelve PaginatedExercisesResponse
    // Sino, devuelve ExerciseDto[]
    return this.api.get<ExerciseDto[] | PaginatedExercisesResponse>('/api/exercises', { params: params ?? {} });
  }

  getById(id: number) {
    return this.api.get<ExerciseDto>(`/api/exercises/${id}`);
  }

  create(body: CreateExerciseDto) {
    return this.api.post<ExerciseDto>('/api/exercises', body);
  }

  update(id: number, body: UpdateExerciseDto) {
    return this.api.put<ExerciseDto>(`/api/exercises/${id}`, body);
  }

  remove(id: number) {
    return this.api.delete<void>(`/api/exercises/${id}`);
  }
}
