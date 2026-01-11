import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { BpDialog } from '../bp-dialog';
import { ExercisesApi, ExerciseDto } from '../../services/exercises.api';

@Component({
  selector: 'app-exercise-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ProgressSpinnerModule,
    BpDialog,
  ],
  templateUrl: './exercise-search-dialog.html',
})
export class ExerciseSearchDialog {
  private readonly exercisesApi = inject(ExercisesApi);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Output() selectExercise = new EventEmitter<ExerciseDto>();
  @Output() previewExercise = new EventEmitter<ExerciseDto>();

  searchQuery = signal('');
  exercises = signal<ExerciseDto[]>([]);
  loading = signal(false);
  loaded = signal(false);

  filteredExercises = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const all = this.exercises();
    if (!query) return all;
    return all.filter(
      (e) =>
        e.name?.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query) ||
        e.type?.toLowerCase().includes(query)
    );
  });

  onOpen(): void {
    if (!this.loaded()) {
      this.loadExercises();
    }
  }

  loadExercises(): void {
    this.loading.set(true);
    this.exercisesApi.list({}).subscribe({
      next: (response) => {
        const items = Array.isArray(response) ? response : (response as any).items || [];
        this.exercises.set(items);
        this.loading.set(false);
        this.loaded.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.exercises.set([]);
      },
    });
  }

  onSelect(exercise: ExerciseDto): void {
    this.selectExercise.emit(exercise);
  }

  onPreview(exercise: ExerciseDto, event: Event): void {
    event.stopPropagation();
    this.previewExercise.emit(exercise);
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.searchQuery.set('');
  }

  getTypeLabel(type: string | undefined): string {
    const labels: Record<string, string> = {
      cardio: 'Cardio',
      strength: 'Fuerza',
      flexibility: 'Flexibilidad',
      balance: 'Equilibrio',
      shooting: 'Tiro',
      passing: 'Pase',
      dribbling: 'Bote',
      defense: 'Defensa',
      warmup: 'Calentamiento',
      cooldown: 'Vuelta a la calma',
    };
    return labels[type || ''] || type || 'General';
  }

  formatDuration(seconds: number | undefined): string {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    return mins > 0 ? `${mins} min` : `${seconds} seg`;
  }
}
