import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';

import { ExerciseDraft, ExerciseForm, ExerciseFormValue } from '../components/exercise-form/exercise-form';
import { BpDialog } from '../components/bp-dialog/bp-dialog';
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
  materialEquipo?: Array<{ equipmentId: number; name: string }>;
  dificultad?: {
    tactica?: number;
    tecnica?: number;
    fisica?: number;
    mental?: number;
  };
}

// Tipos específicos de basketball que ahora usa el formulario
type UiType = 
  | 'TECNICA_BOTE' | 'FINALIZACION_ARO' | 'TIRO' | 'PASE'
  | 'TACTICA_ATAQUE' | 'TACTICA_ATAQUE_DEFENSA'
  | 'DEFENSA_EQUIPO' | 'DEFENSA_INDIVIDUAL' | 'DEFENSA_FUNDAMENTOS'
  | 'REBOTE' | 'TECNICA_POSTE' | 'ATAQUE_INDIVIDUAL' | 'TECNICA_PIES'
  | 'CONDICIONAMIENTO_FISICO' | 'MOVILIDAD_RECUPERACION'
  | 'TACTICA_TRANSICION' | 'ABP_SAQUES' | 'JUEGO_REDUCIDO';


@Component({
  selector: 'app-exercises',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    BpDialog,
    TagModule,
    PaginatorModule,
    ExerciseForm,
		AppShell,
		PageHeader,
  ],
  templateUrl: './exercises.html',
  styleUrl: './exercises.scss',
})
export class Exercises implements OnInit {
  private readonly exercisesApi = inject(ExercisesApi);
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly exerciseEquipmentApi = inject(ExerciseEquipmentApi);

  // Make Math available in template
  Math = Math;

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

  // Pagination
  currentPage = 0;
  pageSize = 12; // Mostrar 12 ejercicios por página
  totalRecords = 0;

  private readonly refresh$ = new BehaviorSubject<void>(undefined);
  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly loadError$ = new BehaviorSubject<string | null>(null);

  private readonly exercises$ = this.refresh$.pipe(
    switchMap(() => {
      this.loading$.next(true);
      this.loadError$.next(null);
      
      // Enviar parámetros de paginación al backend
      const params = {
        page: this.currentPage + 1, // PrimeNG usa 0-indexed, backend usa 1-indexed
        pageSize: this.pageSize,
        search: this.filters.search || undefined,
      };
      
      return this.exercisesApi.list(params).pipe(
        map((response) => {
          this.loading$.next(false);
          
          // Si backend devuelve { exercises, pagination }
          if (response && typeof response === 'object' && 'exercises' in response && 'pagination' in response) {
            this.totalRecords = response.pagination.total;
            return (response.exercises ?? []).map((dto) => this.fromDto(dto));
          }
          
          // Fallback: backend devolvió array directo (sin paginación)
          const items = Array.isArray(response) ? response : [];
          this.totalRecords = items.length;
          return items.map((dto) => this.fromDto(dto));
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
      // Aplicar filtros client-side (tipo y duración)
      // La búsqueda ya se hace en backend
      const filtered = items.filter((exercise) => {
        const matchesTipo = this.filters.tipo === 'Todos' || exercise.tipo === this.filters.tipo;
        const matchesDuracion =
          this.filters.duracion === 'Cualquiera' ||
          (this.filters.duracion === '10-15' && exercise.duracion >= 10 && exercise.duracion <= 15) ||
          (this.filters.duracion === '15-20' && exercise.duracion >= 15 && exercise.duracion <= 20);

        return matchesTipo && matchesDuracion;
      });

      // Los items ya vienen paginados del backend, no necesitamos paginar client-side
      return { 
        items, 
        filtered, 
        paged: filtered, // Ya están paginados
        loading, 
        error,
        totalRecords: this.totalRecords,
        currentPage: this.currentPage,
        pageSize: this.pageSize
      };
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
    this.currentPage = 0; // Reset page when filtering
    this.refresh$.next();
  }

  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.refresh$.next(); // Recargar con nuevos parámetros de paginación
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
    // Extraer valores de dificultad del objeto
    const dif = exercise.dificultad || {};
    const dificultadTactica = typeof dif === 'object' && 'tactica' in dif ? (dif as any).tactica : 3;
    const dificultadTecnica = typeof dif === 'object' && 'tecnica' in dif ? (dif as any).tecnica : 3;
    const dificultadFisica = typeof dif === 'object' && 'fisica' in dif ? (dif as any).fisica : 3;
    const dificultadMental = typeof dif === 'object' && 'mental' in dif ? (dif as any).mental : 3;
    
    return {
      nombre: exercise.nombre,
      tipo: exercise.tipo,
      duracionSegundos: (exercise.duracion || 15) * 60, // Convertir minutos a segundos
      materialesNecesarios: exercise.material || [],
      estado: 'Activo',
      descripcion: '',
      dificultadTactica,
      dificultadTecnica,
      dificultadFisica,
      dificultadMental,
      etiquetas: [], // Las etiquetas son diferentes de los materiales
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
          this.refresh();
        },
        error: (err: Error) => {
          this.loadError$.next(err.message);
        },
      });
      return;
    }

    this.exercisesApi.create(payload).subscribe({
      next: () => {
        this.closeNewExercise();
        this.refresh();
      },
      error: (err: Error) => {
        this.loadError$.next(err.message);
      },
    });
  }

  private fromDto(dto: ExerciseDto): Exercise {
    // Mapear los materiales desde equipmentItems
    const material = (dto.equipmentItems || []).map(item => item.name);
    const materialEquipo = (dto.equipmentItems || []).map(item => ({
      equipmentId: item.id,
      name: item.name,
    }));
    
    // Obtener tipo original de tags (preferido) o usar mapeo inverso como fallback
    const tags = dto.tags as { tipo_original?: string; tags?: string[]; materiales?: string[] } | null;
    const tipoOriginal = tags?.tipo_original as UiType | undefined;
    const tipo = tipoOriginal || this.mapApiToUiType(dto.type);
    
    return {
      id: String(dto.id),
      nombre: dto.name,
      duracion: Math.ceil(dto.duration / 60), // Convertir segundos a minutos si es necesario
      tipo,
      material,
      materialEquipo,
      dificultad: dto.difficulty as any,
    };
  }

  private toApiPayload(value: ExerciseFormValue) {
    const tipoOriginal = (value.tipo || 'TECNICA_BOTE') as UiType;
    const type = this.mapUiToApiType(tipoOriginal);
    return {
      name: value.nombre,
      type,
      duration: Math.ceil(value.duracionSegundos / 60), // Convertir segundos a minutos
      description: value.descripcion,
      // 4 dimensiones de dificultad
      difficulty: {
        tactica: value.dificultadTactica,
        tecnica: value.dificultadTecnica,
        fisica: value.dificultadFisica,
        mental: value.dificultadMental,
      },
      // Guardar tipo original de basketball y etiquetas
      tags: {
        tipo_original: tipoOriginal,
        tags: value.etiquetas ?? [],
        materiales: value.materialesNecesarios ?? [],
      },
      active: value.estado !== 'Inactivo',
    };
  }

  private mapUiToApiType(ui: UiType): ExerciseType {
    // Mapeo de tipos específicos de basketball a tipos de API
    const mapping: Record<UiType, ExerciseType> = {
      'TECNICA_BOTE': 'tecnico',
      'FINALIZACION_ARO': 'tiro',
      'TIRO': 'tiro',
      'PASE': 'tecnico',
      'TACTICA_ATAQUE': 'ataque',
      'TACTICA_ATAQUE_DEFENSA': 'tactico',
      'DEFENSA_EQUIPO': 'defensa',
      'DEFENSA_INDIVIDUAL': 'defensa',
      'DEFENSA_FUNDAMENTOS': 'defensa',
      'REBOTE': 'fisico',
      'TECNICA_POSTE': 'tecnico',
      'ATAQUE_INDIVIDUAL': 'ataque',
      'TECNICA_PIES': 'fisico',
      'CONDICIONAMIENTO_FISICO': 'fisico',
      'MOVILIDAD_RECUPERACION': 'fisico',
      'TACTICA_TRANSICION': 'tactico',
      'ABP_SAQUES': 'tactico',
      'JUEGO_REDUCIDO': 'tactico',
    };
    return mapping[ui] || 'tactico';
  }

  private mapApiToUiType(type: ExerciseType): UiType {
    // Mapeo inverso: tipos de API a tipos específicos de basketball
    // Como hay múltiples tipos UI que mapean al mismo API type,
    // usamos un tipo por defecto para cada categoría
    const mapping: Record<ExerciseType, UiType> = {
      'tecnico': 'TECNICA_BOTE',
      'tactico': 'TACTICA_ATAQUE',
      'fisico': 'CONDICIONAMIENTO_FISICO',
      'tiro': 'TIRO',
      'defensa': 'DEFENSA_EQUIPO',
      'ataque': 'ATAQUE_INDIVIDUAL',
    };
    return mapping[type] || 'TECNICA_BOTE';
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
    desired: Array<{ equipmentId: number; name: string }>,
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
      const current = new Set<number>();
      for (const row of currentRows ?? []) {
        current.add(Number(row.equipmentId));
      }

      const wanted = new Set<number>();
      for (const item of desired ?? []) {
        const equipmentId = Number(item.equipmentId);
        if (!Number.isFinite(equipmentId)) continue;
        wanted.add(equipmentId);
      }

      const toCreate: number[] = [];
      const toDelete: number[] = [];

      for (const equipmentId of wanted) {
        if (!current.has(equipmentId)) toCreate.push(equipmentId);
      }
      for (const equipmentId of current) {
        if (!wanted.has(equipmentId)) toDelete.push(equipmentId);
      }

      const createOne = (equipmentId: number) =>
        new Promise<void>((resolve, reject) => {
          this.exerciseEquipmentApi.createForExercise(exerciseId, { equipmentId }).subscribe({
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

      for (const equipmentId of toCreate) await createOne(equipmentId);
      for (const equipmentId of toDelete) await deleteOne(equipmentId);
    });
  }
}
