import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';

import { ExerciseDraft, ExerciseForm, ExerciseFormValue } from '../components/exercise-form/exercise-form';
import { ExercisesApi, ExerciseDto, ExerciseType } from '../services/exercises.api';

type Option = { label: string; value: string };

interface Exercise {
  id: string;
  nombre: string;
  duracion: number;
  tipo: string;
  material: string[];
}

type UiType = 'Técnico' | 'Táctico' | 'Físico';

@Component({
  selector: 'app-exercises',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DialogModule,
    TagModule,
    ExerciseForm,
  ],
  templateUrl: './exercises.html',
  styleUrl: './exercises.css',
})
export class Exercises implements OnInit {
  private readonly exercisesApi = inject(ExercisesApi);

  teams: string[] = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam: string = this.teams[0];

  tipoOptions: Option[] = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Técnico', value: 'Técnico' },
    { label: 'Táctico', value: 'Táctico' },
    { label: 'Físico', value: 'Físico' },
  ];

  duracionOptions: Option[] = [
    { label: 'Cualquiera', value: 'Cualquiera' },
    { label: '10-15 min', value: '10-15' },
    { label: '15-20 min', value: '15-20' },
  ];

  filters = {
    tipo: 'Todos',
    duracion: 'Cualquiera',
    search: '',
  };

  exercises: Exercise[] = [];

  loading = false;
  loadError: string | null = null;

  newExerciseVisible = false;
  dialogMode: 'create' | 'edit' | 'view' = 'create';
  selectedExercise: Exercise | null = null;

  ngOnInit() {
    this.refreshExercises();
  }

  get filteredExercises(): Exercise[] {
    return this.exercises.filter((exercise) => {
      const matchesTipo = this.filters.tipo === 'Todos' || exercise.tipo === this.filters.tipo;
      const matchesDuracion =
        this.filters.duracion === 'Cualquiera' ||
        (this.filters.duracion === '10-15' && exercise.duracion >= 10 && exercise.duracion <= 15) ||
        (this.filters.duracion === '15-20' && exercise.duracion >= 15 && exercise.duracion <= 20);
      const matchesSearch =
        this.filters.search === '' ||
        exercise.nombre.toLowerCase().includes(this.filters.search.toLowerCase());

      return matchesTipo && matchesDuracion && matchesSearch;
    });
  }

  openNewExercise() {
    this.dialogMode = 'create';
    this.selectedExercise = null;
    this.newExerciseVisible = true;
  }

  openViewExercise(exercise: Exercise) {
    this.dialogMode = 'view';
    this.selectedExercise = exercise;
    this.newExerciseVisible = true;
  }

  openEditExercise(exercise: Exercise) {
    this.dialogMode = 'edit';
    this.selectedExercise = exercise;
    this.newExerciseVisible = true;
  }

  copyExercise(exercise: Exercise) {
    // Open the form with prefilled values so the user can tweak before saving.
    this.dialogMode = 'create';
    this.selectedExercise = {
      ...exercise,
      id: '',
      nombre: `${exercise.nombre} (copia)`,
    };
    this.newExerciseVisible = true;
  }

  closeNewExercise() {
    this.newExerciseVisible = false;
  }

  get dialogHeader(): string {
    if (this.dialogMode === 'edit') return 'Editar ejercicio';
    if (this.dialogMode === 'view') return 'Ver ejercicio';
    return 'Nuevo ejercicio';
  }

  get initialDraft(): ExerciseDraft | null {
    if (!this.selectedExercise) return null;
    return this.toDraft(this.selectedExercise);
  }

  private toDraft(exercise: Exercise): ExerciseDraft {
    return {
      nombre: exercise.nombre,
      tipo: exercise.tipo,
      duracionPredeterminada: exercise.duracion,
      materialNecesario: exercise.material,
      estado: 'Activo',
      descripcion: '',
      subtipo: [],
      nivelDificultad: '',
      intensidad: '',
      objetivoPrincipal: '',
      numeroJugadores: 10,
      categoriaRecomendada: [],
      observaciones: '',
    };
  }

  saveNewExercise(value: ExerciseFormValue) {
    if (this.dialogMode === 'view') {
      this.closeNewExercise();
      return;
    }

    const payload = this.toApiPayload(value);

    if (this.dialogMode === 'edit' && this.selectedExercise?.id) {
      const id = Number(this.selectedExercise.id);
      this.exercisesApi.update(id, payload).subscribe({
        next: () => {
          this.closeNewExercise();
          this.refreshExercises();
        },
        error: (err: Error) => {
          this.loadError = err.message;
        },
      });
      return;
    }

    this.exercisesApi.create(payload).subscribe({
      next: () => {
        this.closeNewExercise();
        this.refreshExercises();
      },
      error: (err: Error) => {
        this.loadError = err.message;
      },
    });
  }

  refreshExercises() {
    this.loading = true;
    this.loadError = null;
    this.exercisesApi.list().subscribe({
      next: (items) => {
        this.exercises = items.map((dto) => this.fromDto(dto));
        this.loading = false;
      },
      error: (err: Error) => {
        this.loading = false;
        this.loadError = err.message;
      },
    });
  }

  private fromDto(dto: ExerciseDto): Exercise {
    return {
      id: String(dto.id),
      nombre: dto.name,
      duracion: dto.duration,
      tipo: this.mapApiToUiType(dto.type),
      // Equipment relation isn't modeled in the API schema yet; keep empty for now.
      material: [],
    };
  }

  private toApiPayload(value: ExerciseFormValue) {
    const type = this.mapUiToApiType((value.tipo || 'Técnico') as UiType);
    return {
      name: value.nombre,
      type,
      duration: value.duracionPredeterminada,
      description: value.descripcion,
      // Keep difficulty flexible (backend expects JSON). We'll refine when the UI captures it.
      difficulty: {
        nivelDificultad: value.nivelDificultad,
        intensidad: value.intensidad,
        objetivoPrincipal: value.objetivoPrincipal,
      },
      tags: [...(value.subtipo ?? []), ...(value.categoriaRecomendada ?? [])],
      active: value.estado !== 'Inactivo',
    };
  }

  private mapUiToApiType(ui: UiType): ExerciseType {
    // Temporary mapping until the UI is updated to use the same taxonomy.
    if (ui === 'Físico') return 'cardio';
    if (ui === 'Táctico') return 'balance';
    return 'strength';
  }

  private mapApiToUiType(type: ExerciseType): UiType {
    if (type === 'cardio') return 'Físico';
    if (type === 'balance') return 'Táctico';
    return 'Técnico';
  }
}
