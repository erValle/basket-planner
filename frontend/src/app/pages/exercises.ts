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
import { EquipmentApi } from '../services/equipment.api';
import { ExerciseEquipmentApi } from '../services/exercise-equipment.api';
import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';

import { BehaviorSubject, combineLatest, map, shareReplay, startWith, switchMap } from 'rxjs';

type Option = { label: string; value: string };

interface Exercise {
  id: string;
  nombre: string;
  duracion: number;
  tipo: string;
  material: string[];
  materialEquipo?: Array<{ equipmentId: number; name: string; quantity: number }>;
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
		AppShell,
		PageHeader,
  ],
  templateUrl: './exercises.html',
  styleUrl: './exercises.css',
})
export class Exercises implements OnInit {
  private readonly exercisesApi = inject(ExercisesApi);
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly exerciseEquipmentApi = inject(ExerciseEquipmentApi);

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

  private readonly refresh$ = new BehaviorSubject<void>(undefined);
  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly loadError$ = new BehaviorSubject<string | null>(null);

  private readonly exercises$ = this.refresh$.pipe(
    switchMap(() => {
      this.loading$.next(true);
      this.loadError$.next(null);
      return this.exercisesApi.list().pipe(
        map((items) => (items ?? []).map((dto) => this.fromDto(dto))),
        map((items) => {
          this.loading$.next(false);
          return items;
        }),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly vm$ = combineLatest({
    items: this.exercises$,
    loading: this.loading$.pipe(startWith(false)),
    error: this.loadError$.pipe(startWith(null)),
    tick: this.refresh$.pipe(startWith(undefined)),
  }).pipe(
    map(({ items, loading, error }) => {
      const filtered = items.filter((exercise) => {
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

      return { items, filtered, loading, error };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  newExerciseVisible = false;
  dialogMode: 'create' | 'edit' | 'view' = 'create';
  selectedExercise: Exercise | null = null;

  private equipmentIndex = new Map<number, string>();

  ngOnInit() {
    this.refresh();

    // Best-effort load of equipment names to label materialEquipo.
    this.equipmentApi.list({ limit: 500 } as any).subscribe({
      next: (items) => {
        this.equipmentIndex = new Map(
          (items ?? []).map((e) => [Number(e.id), (e.name ?? '').toString()]),
        );
      },
      error: () => {
        // Honest UI: we just won't have labels; the form can still work.
        this.equipmentIndex = new Map();
      },
    });
  }

  refresh(): void {
    this.refresh$.next();
  }

  openNewExercise() {
    this.dialogMode = 'create';
    this.selectedExercise = null;
    this.newExerciseVisible = true;
  }

  openViewExercise(exercise: Exercise) {
    this.dialogMode = 'view';
    this.selectedExercise = exercise;
    this.loadExerciseEquipmentForDialog(exercise);
    this.newExerciseVisible = true;
  }

  openEditExercise(exercise: Exercise) {
    this.dialogMode = 'edit';
    this.selectedExercise = exercise;
    this.loadExerciseEquipmentForDialog(exercise);
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
    // Copy should also copy material selections.
    this.selectedExercise.materialEquipo = (exercise.materialEquipo ?? []).map((x) => ({ ...x }));
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
      materialEquipo: exercise.materialEquipo ?? [],
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
          this.syncExerciseEquipment(id, value.materialEquipo ?? [])
            .then(() => {
              this.closeNewExercise();
              this.refresh();
            })
            .catch((err: unknown) => {
              const msg = err instanceof Error ? err.message : 'Error inesperado.';
              // Exercise was saved, equipment sync failed.
              this.loadError$.next(`Ejercicio guardado, pero no se pudo guardar el material: ${msg}`);
            });
        },
        error: (err: Error) => {
          this.loadError$.next(err.message);
        },
      });
      return;
    }

    this.exercisesApi.create(payload).subscribe({
      next: (created) => {
        const id = Number(created?.id);
        if (!Number.isFinite(id)) {
          this.closeNewExercise();
          this.refresh();
          return;
        }

        this.syncExerciseEquipment(id, value.materialEquipo ?? [])
          .then(() => {
            this.closeNewExercise();
            this.refresh();
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Error inesperado.';
            this.loadError$.next(`Ejercicio creado, pero no se pudo guardar el material: ${msg}`);
          });
      },
      error: (err: Error) => {
        this.loadError$.next(err.message);
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
      materialEquipo: [],
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

  private loadExerciseEquipmentForDialog(exercise: Exercise): void {
    const exerciseId = Number(exercise.id);
    if (!Number.isFinite(exerciseId)) return;

    this.exerciseEquipmentApi.listForExercise(exerciseId).subscribe({
      next: (rows) => {
        const mapped = (rows ?? []).map((row) => {
          const equipmentId = Number(row.equipmentId);
          const fromJoin = (row as any)?.equipmentItem?.name;
          return {
            equipmentId,
            name:
              (typeof fromJoin === 'string' && fromJoin.trim().length > 0
                ? fromJoin
                : this.equipmentIndex.get(equipmentId)) ?? `Material #${equipmentId}`,
            quantity: Number(row.quantity) || 1,
          };
        });

        // Ensure selectedExercise is still the same one.
        if (this.selectedExercise?.id === exercise.id) {
          this.selectedExercise = {
            ...exercise,
            materialEquipo: mapped,
            material: mapped.map((x) => x.name),
          };
        }
      },
      error: (err: Error) => {
        // Honest UI: don't block opening; just show a message.
        this.loadError$.next(`No se pudo cargar el material del ejercicio: ${err.message}`);
      },
    });
  }

  private syncExerciseEquipment(
    exerciseId: number,
    desired: Array<{ equipmentId: number; name: string; quantity: number }>,
  ): Promise<void> {
    const listCurrent = () =>
      new Promise<import('../services/exercise-equipment.api').ExerciseEquipmentRowDto[]>((resolve, reject) => {
        this.exerciseEquipmentApi.listForExercise(exerciseId).subscribe({
          next: (rows) => resolve(rows ?? []),
          error: (e: unknown) => reject(e),
        });
      });

    const currentRowsPromise = listCurrent();

    return currentRowsPromise.then(async (currentRows) => {
      const current = new Map<number, number>();
      for (const row of currentRows ?? []) {
        current.set(Number(row.equipmentId), Number(row.quantity) || 1);
      }

      const wanted = new Map<number, number>();
      for (const item of desired ?? []) {
        const equipmentId = Number(item.equipmentId);
        if (!Number.isFinite(equipmentId)) continue;
        const qty = Math.max(1, Number(item.quantity) || 1);
        wanted.set(equipmentId, qty);
      }

      const toCreate: Array<{ equipmentId: number; quantity: number }> = [];
      const toUpdate: Array<{ equipmentId: number; quantity: number }> = [];
      const toDelete: number[] = [];

      for (const [equipmentId, quantity] of wanted.entries()) {
        if (!current.has(equipmentId)) toCreate.push({ equipmentId, quantity });
        else if (current.get(equipmentId) !== quantity) toUpdate.push({ equipmentId, quantity });
      }
      for (const equipmentId of current.keys()) {
        if (!wanted.has(equipmentId)) toDelete.push(equipmentId);
      }

      const createOne = (row: { equipmentId: number; quantity: number }) =>
        new Promise<void>((resolve, reject) => {
          this.exerciseEquipmentApi.createForExercise(exerciseId, row).subscribe({
            next: () => resolve(),
            error: (e: unknown) => reject(e),
          });
        });
      const updateOne = (row: { equipmentId: number; quantity: number }) =>
        new Promise<void>((resolve, reject) => {
          this.exerciseEquipmentApi.updateForExercise(exerciseId, row.equipmentId, {
            quantity: row.quantity,
          }).subscribe({
            next: () => resolve(),
            error: (e: unknown) => reject(e),
          });
        });
      const deleteOne = (equipmentId: number) =>
        new Promise<void>((resolve, reject) => {
          this.exerciseEquipmentApi.deleteForExercise(exerciseId, equipmentId).subscribe({
            next: () => resolve(),
            error: (e: unknown) => reject(e),
          });
        });

      for (const row of toCreate) await createOne(row);
      for (const row of toUpdate) await updateOne(row);
      for (const equipmentId of toDelete) await deleteOne(equipmentId);
    });
  }
}
