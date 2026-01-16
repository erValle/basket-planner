import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

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
  etiquetas?: string[];
}

// Tipos específicos de basketball que ahora usa el formulario
type UiType = 
  | 'TECNICA_BOTE' | 'FINALIZACION_ARO' | 'TIRO' | 'PASE'
  | 'TACTICA_ATAQUE' | 'TACTICA_ATAQUE_DEFENSA'
  | 'DEFENSA_EQUIPO' | 'DEFENSA_INDIVIDUAL' | 'DEFENSA_FUNDAMENTOS'
  | 'REBOTE' | 'TECNICA_POSTE' | 'ATAQUE_INDIVIDUAL' | 'TECNICA_PIES'
  | 'CONDICIONAMIENTO_FISICO' | 'MOVILIDAD_RECUPERACION'
  | 'TACTICA_TRANSICION' | 'ABP_SAQUES' | 'JUEGO_REDUCIDO';

// Mapeo de categorías de filtro a tipos específicos de ejercicios
const CATEGORY_TO_TYPES: Record<string, string[]> = {
  'Técnica Individual': [
    'TECNICA_BOTE', 'TECNICA_PIES', 'TECNICA_POSTE', 
    'TIRO', 'FINALIZACION_ARO', 'PASE'
  ],
  'Táctica': [
    'TACTICA_ATAQUE', 'TACTICA_ATAQUE_DEFENSA', 
    'TACTICA_TRANSICION', 'JUEGO_REDUCIDO', 'ABP_SAQUES'
  ],
  'Defensa': [
    'DEFENSA_INDIVIDUAL', 'DEFENSA_EQUIPO', 'DEFENSA_FUNDAMENTOS'
  ],
  'Físico / Recuperación': [
    'CONDICIONAMIENTO_FISICO', 'MOVILIDAD_RECUPERACION'
  ],
  'Otros': [
    'REBOTE', 'ATAQUE_INDIVIDUAL'
  ],
};

// Mapeo de tipos técnicos a etiquetas legibles para la UI
const TYPE_LABELS: Record<string, string> = {
  'TECNICA_BOTE': 'Bote',
  'TECNICA_PIES': 'Pies',
  'TECNICA_POSTE': 'Poste',
  'TIRO': 'Tiro',
  'FINALIZACION_ARO': 'Finalización',
  'PASE': 'Pase',
  'TACTICA_ATAQUE': 'Ataque',
  'TACTICA_ATAQUE_DEFENSA': 'Ataque/Defensa',
  'TACTICA_TRANSICION': 'Transición',
  'JUEGO_REDUCIDO': 'Juego Reducido',
  'ABP_SAQUES': 'Saques',
  'DEFENSA_INDIVIDUAL': 'Def. Individual',
  'DEFENSA_EQUIPO': 'Def. Equipo',
  'DEFENSA_FUNDAMENTOS': 'Def. Fundamentos',
  'CONDICIONAMIENTO_FISICO': 'Físico',
  'MOVILIDAD_RECUPERACION': 'Recuperación',
  'REBOTE': 'Rebote',
  'ATAQUE_INDIVIDUAL': 'Ataque Individual',
};


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
		ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './exercises.html',
  styleUrl: './exercises.scss',
})
export class Exercises implements OnInit {
  private readonly exercisesApi = inject(ExercisesApi);
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly exerciseEquipmentApi = inject(ExerciseEquipmentApi);
  private readonly confirmation = inject(ConfirmationService);

  // Make Math available in template
  Math = Math;

  // Método para formatear el tipo de ejercicio de forma legible
  formatType(type: string): string {
    return TYPE_LABELS[type] ?? type;
  }

  tipoOptions: Option[] = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Técnica Individual', value: 'Técnica Individual' },
    { label: 'Táctica', value: 'Táctica' },
    { label: 'Defensa', value: 'Defensa' },
    { label: 'Físico / Recuperación', value: 'Físico / Recuperación' },
    { label: 'Otros', value: 'Otros' },
  ];

  duracionOptions: Option[] = [
    { label: 'Cualquiera', value: 'Cualquiera' },
    { label: 'Menos de 5 min', value: '<5' },
    { label: '5-10 min', value: '5-10' },
    { label: '10-15 min', value: '10-15' },
    { label: '15-20 min', value: '15-20' },
    { label: 'Más de 20 min', value: '>20' },
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
  private readonly page$ = new BehaviorSubject<number>(0);
  readonly loading$ = new BehaviorSubject<boolean>(false);
  readonly loadError$ = new BehaviorSubject<string | null>(null);

  // Almacenar todos los ejercicios para filtrado client-side
  private allExercises: Exercise[] = [];

  private readonly exercises$ = this.refresh$.pipe(
    switchMap(() => {
      this.loading$.next(true);
      this.loadError$.next(null);
      
      // Obtener TODOS los ejercicios (sin paginación backend)
      // El filtrado y paginación se hará client-side
      const params = {
        search: this.filters.search || undefined,
      };
      
      return this.exercisesApi.list(params).pipe(
        map((response) => {
          this.loading$.next(false);
          
          // Si backend devuelve { exercises, pagination }
          if (response && typeof response === 'object' && 'exercises' in response && 'pagination' in response) {
            return (response.exercises ?? []).map((dto) => this.fromDto(dto));
          }
          
          // Fallback: backend devolvió array directo (sin paginación)
          const items = Array.isArray(response) ? response : [];
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
    page: this.page$.pipe(startWith(0)),
  }).pipe(
    map(({ items, loading, error, page }) => {
      // Guardar todos los ejercicios
      this.allExercises = items;
      
      // 1. Aplicar filtros client-side (búsqueda, tipo y duración)
      const searchTerm = this.filters.search?.toLowerCase().trim() || '';
      
      const filtered = items.filter((exercise) => {
        // Filtro por búsqueda de texto
        let matchesSearch = true;
        if (searchTerm) {
          const nombre = exercise.nombre?.toLowerCase() || '';
          const tipo = exercise.tipo?.toLowerCase() || '';
          const materiales = (exercise.material || []).join(' ').toLowerCase();
          const etiquetas = (exercise.etiquetas || []).join(' ').toLowerCase();
          matchesSearch = nombre.includes(searchTerm) || 
                         tipo.includes(searchTerm) || 
                         materiales.includes(searchTerm) ||
                         etiquetas.includes(searchTerm);
        }
        
        // Filtro por categoría de tipo
        let matchesTipo = this.filters.tipo === 'Todos';
        if (!matchesTipo && this.filters.tipo in CATEGORY_TO_TYPES) {
          const typesInCategory = CATEGORY_TO_TYPES[this.filters.tipo];
          matchesTipo = typesInCategory.includes(exercise.tipo);
        }
        
        // Filtro por duración
        let matchesDuracion = this.filters.duracion === 'Cualquiera';
        if (!matchesDuracion) {
          const dur = exercise.duracion;
          switch (this.filters.duracion) {
            case '<5': matchesDuracion = dur < 5; break;
            case '5-10': matchesDuracion = dur >= 5 && dur < 10; break;
            case '10-15': matchesDuracion = dur >= 10 && dur < 15; break;
            case '15-20': matchesDuracion = dur >= 15 && dur <= 20; break;
            case '>20': matchesDuracion = dur > 20; break;
          }
        }

        return matchesSearch && matchesTipo && matchesDuracion;
      });

      // 2. Actualizar total de registros basado en los filtrados
      this.totalRecords = filtered.length;

      // 3. Aplicar paginación client-side sobre los ejercicios filtrados
      const startIndex = this.currentPage * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      const paged = filtered.slice(startIndex, endIndex);

      return { 
        items, 
        filtered, 
        paged,
        loading, 
        error,
        totalRecords: filtered.length,
        currentPage: this.currentPage,
        pageSize: this.pageSize
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  newExerciseVisible = false;
  dialogMode: 'create' | 'edit' | 'view' = 'create';
  selectedExercise: Exercise | null = null;
  initialDraft: ExerciseDraft | null = null;

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
    this.page$.next(0);
    this.refresh$.next();
  }

  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.page$.next(this.currentPage); // Solo notificar cambio de página (sin recargar backend)
  }

  openNewExercise() {
    this.dialogMode = 'create';
    this.selectedExercise = null;
    this.initialDraft = null;
    this.newExerciseVisible = true;
  }

  openViewExercise(exercise: Exercise) {
    this.dialogMode = 'view';
    this.selectedExercise = exercise;
    this.initialDraft = this.toDraft(exercise);
    this.newExerciseVisible = true;
  }

  openEditExercise(exercise: Exercise) {
    this.dialogMode = 'edit';
    this.selectedExercise = exercise;
    this.initialDraft = this.toDraft(exercise);
    this.newExerciseVisible = true;
  }

  closeNewExercise() {
    this.newExerciseVisible = false;
    // Reset state so next open starts fresh
    this.selectedExercise = null;
    this.initialDraft = null;
    this.dialogMode = 'create';
  }

  deleteExercise() {
    if (!this.selectedExercise?.id) return;
    
    const id = Number(this.selectedExercise.id);
    const exerciseName = this.selectedExercise.nombre;

    this.confirmation.confirm({
      message: `¿Estás seguro de que quieres eliminar el ejercicio "${exerciseName}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'bp-btn bp-btn-danger',
      rejectButtonStyleClass: 'bp-btn bp-btn-secondary',
      accept: () => {
        this.exercisesApi.remove(id).subscribe({
          next: () => {
            this.closeNewExercise();
            this.refresh();
          },
          error: (err: Error) => {
            this.loadError$.next(`Error al eliminar ejercicio: ${err.message}`);
          },
        });
      },
    });
  }

  get dialogHeader(): string {
    if (this.dialogMode === 'edit') return 'Editar ejercicio';
    if (this.dialogMode === 'view') return 'Ver ejercicio';
    return 'Nuevo ejercicio';
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
      etiquetas: exercise.etiquetas || [],
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
      error: (err: any) => {
        // Mostrar mensaje de error más detallado
        const errorMsg = err?.error?.message || err?.message || 'Error desconocido al crear ejercicio';
        this.loadError$.next(errorMsg);
      },
    });
  }

  private fromDto(dto: ExerciseDto): Exercise {
    // Obtener tags parseado
    const tagsData = dto.tags as { tipo_original?: string; tags?: string[]; materiales?: string[] } | null;
    
    // Mapear los materiales: primero de equipmentItems (relación), luego de tags.materiales (fallback)
    let material = (dto.equipmentItems || []).map(item => item.name);
    if (material.length === 0 && tagsData?.materiales) {
      material = tagsData.materiales;
    }
    
    const materialEquipo = (dto.equipmentItems || []).map(item => ({
      equipmentId: item.id,
      name: item.name,
    }));
    
    // Obtener tipo original de tags (preferido) o usar mapeo inverso como fallback
    const tipoOriginal = tagsData?.tipo_original as UiType | undefined;
    const tipo = tipoOriginal || this.mapApiToUiType(dto.type);
    
    return {
      id: String(dto.id),
      nombre: dto.name,
      duracion: dto.duration, // Ya está en minutos desde el backend
      tipo,
      material,
      materialEquipo,
      dificultad: dto.difficulty as any,
      etiquetas: tagsData?.tags || [],
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
