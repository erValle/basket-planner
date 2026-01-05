import { Injectable, inject } from '@angular/core';

import { ApiClient } from './api-client';

export interface ExerciseEquipmentRowDto {
  id: number;
  exerciseId: number;
  equipmentId: number;
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExerciseEquipmentPayload {
  equipmentId: number;
  quantity: number;
}

export interface UpdateExerciseEquipmentPayload {
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class ExerciseEquipmentApi {
  private readonly api = inject(ApiClient);

  listForExercise(exerciseId: number) {
    return this.api.get<ExerciseEquipmentRowDto[]>(
      `/api/exercises/${encodeURIComponent(String(exerciseId))}/equipment`,
    );
  }

  createForExercise(exerciseId: number, payload: CreateExerciseEquipmentPayload) {
    return this.api.post<ExerciseEquipmentRowDto>(
      `/api/exercises/${encodeURIComponent(String(exerciseId))}/equipment`,
      payload,
    );
  }

  updateForExercise(exerciseId: number, equipmentId: number, payload: UpdateExerciseEquipmentPayload) {
    return this.api.put<ExerciseEquipmentRowDto>(
      `/api/exercises/${encodeURIComponent(String(exerciseId))}/equipment/${encodeURIComponent(String(equipmentId))}`,
      payload,
    );
  }

  deleteForExercise(exerciseId: number, equipmentId: number) {
    return this.api.delete<void>(
      `/api/exercises/${encodeURIComponent(String(exerciseId))}/equipment/${encodeURIComponent(String(equipmentId))}`,
    );
  }
}
