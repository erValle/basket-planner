import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';
import { BpDialog } from '../components/bp-dialog';

import { PlanningApiService } from '../services/planning.api';
import { ExercisesApi, ExerciseDto } from '../services/exercises.api';
import {
  PlanningBlockEditor,
  PlanningExerciseEditor,
  PlanningSessionEditor,
} from '../models/planning';
import { ClubContextService } from '../core/context/club-context.service';
import { TeamsApi, TeamDto } from '../services/teams.api';
import { EquipmentApi, EquipmentDto } from '../services/equipment.api';
import { ClubResourcesStore } from '../core/stores/club-resources.store';


type Option = { label: string; value: string };

@Component({
  selector: 'app-planning-edit',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    ChipModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    BpDialog,
    TooltipModule,
    PageHeader,
    AppShell,
  ],
  templateUrl: './planning-edit.html',
  styleUrl: './planning-edit.css',
  providers: [MessageService, ConfirmationService],
})
export class PlanningEdit {
  private readonly clubContext = inject(ClubContextService);
  private readonly teamsApi = inject(TeamsApi);
  private readonly exercisesApi = inject(ExercisesApi);
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly clubResources = inject(ClubResourcesStore);

  // Expose Math for template
  Math = Math;

  teams = signal<TeamDto[]>([]);
  teamOptions = computed(() => this.teams().map((t) => ({ label: t.name, value: String(t.id) })));
  selectedTeamId = signal<string | null>(null);

  equipment = signal<EquipmentDto[]>([]);
  equipmentOptions = computed(() => this.equipment().map((e) => ({ label: e.name, value: String(e.name) })));
  selectedMaterialName = signal<string | null>(null);
  equipmentLoading = signal(false);
  equipmentError = signal<string | null>(null);

  pageLoading = signal(true);

  planningId: string | null = null;
  fromVersion: string | null = null;

  saving = signal(false);
  saveError = signal<string | null>(null);

  intensityOptions: Option[] = [
    { label: 'Baja', value: 'Baja' },
    { label: 'Media', value: 'Media' },
    { label: 'Alta', value: 'Alta' },
  ];

  // Editor state
  sessions = signal<PlanningSessionEditor[]>([]);
  expandedSessionIds = new Set<string>(); // Track which sessions are expanded

  // Exercise search dialog
  exerciseSearchDialogOpen = signal(false);
  exerciseSearchQuery = signal('');
  availableExercises = signal<ExerciseDto[]>([]);
  filteredExercises = computed(() => {
    const query = this.exerciseSearchQuery().trim().toLowerCase();
    const exercises = this.availableExercises();
    if (!query) return exercises;
    return exercises.filter((e) => 
      e.name?.toLowerCase().includes(query) || 
      e.description?.toLowerCase().includes(query)
    );
  });
  loadingExercises = signal(false);
  currentBlockForExercise = signal<PlanningBlockEditor | null>(null);

  // Exercise preview modal
  exercisePreviewDialogOpen = signal(false);
  selectedExerciseForPreview = signal<ExerciseDto | null>(null);

  // Inline validation helper
  touched = new Set<string>();

  constructor(
    private readonly api: PlanningApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toast: MessageService,
    private readonly confirmation: ConfirmationService,
  ) {}

  ngOnInit(): void {
    // Keep team options aligned with the global club selector.
    this.clubContext.selectedClubId$.subscribe(() => {
      this.bootstrapResources();
    });

    this.route.paramMap.subscribe((p) => {
      this.planningId = p.get('id');
      this.fromVersion = this.route.snapshot.queryParamMap.get('fromVersion');
      this.bootstrapDraft();
    });

    this.bootstrapResources();
  }

  private bootstrapResources(): void {
    const clubId = this.clubContext.getSelectedClubIdSnapshot();
    this.pageLoading.set(true);

    // Teams
    this.clubResources.teams$(clubId).subscribe({
      next: (items) => {
        this.teams.set(items ?? []);

        const options = this.teamOptions();
        if (!this.selectedTeamId() && options.length) {
          this.selectedTeamId.set(options[0].value);
        }
      },
      error: () => {
        this.teams.set([]);
        this.selectedTeamId.set(null);
      },
    });

    // Equipment
    this.equipmentLoading.set(true);
    this.equipmentError.set(null);
    this.clubResources.equipment$(clubId).subscribe({
      next: (items) => {
        this.equipmentLoading.set(false);
        this.equipment.set(items ?? []);
        
        const options = this.equipmentOptions();
        const currentMaterial = this.selectedMaterialName();
        if (currentMaterial && !options.some((o) => o.value === currentMaterial)) {
          this.selectedMaterialName.set(null);
        }
        this.pageLoading.set(false);
      },
      error: (e: unknown) => {
        this.equipmentLoading.set(false);
        this.equipment.set([]);
        this.selectedMaterialName.set(null);
        this.equipmentError.set(e instanceof Error ? e.message : 'No se pudo cargar el material del club.');
        this.pageLoading.set(false);
      },
    });
  }



  private uid(prefix: string): string {
    return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
  }

  private bootstrapDraft(): void {
    if (!this.planningId) {
      // Si no hay ID, crear sesión vacía
      this.sessions.set([
        {
          id: this.uid('s'),
          title: 'Sesión nueva',
          date: new Date().toISOString().slice(0, 10),
          blocks: [],
        },
      ]);
      this.pageLoading.set(false);
      return;
    }

    // Cargar planificación desde el backend
    this.api.get(this.planningId, this.fromVersion || undefined).subscribe({
      next: (plan: any) => {
        // Obtener las sesiones desde la versión activa o la especificada
        const version = this.fromVersion 
          ? plan.versions?.find((v: any) => String(v.id) === this.fromVersion)
          : plan.activeVersion;
        
        const sessionsData = version?.sessions || plan.activeVersion?.sessions || [];
        
        // Mapear sesiones a la estructura del editor
        this.sessions.set(this.mapSessionsToEditor(sessionsData));
        this.pageLoading.set(false);
      },
      error: (e: unknown) => {
        console.error('Error loading plan:', e);
        this.toast.add({
          severity: 'error',
          summary: 'Error',
          detail: e instanceof Error ? e.message : 'No se pudo cargar la planificación.',
        });
        this.sessions.set([]);
        this.pageLoading.set(false);
      },
    });
  }

  private mapSessionsToEditor(sessionsData: any[]): PlanningSessionEditor[] {
    if (!Array.isArray(sessionsData)) return [];

    return sessionsData.map((s, idx) => {
      const exercises = Array.isArray(s?.exercises) ? s.exercises : [];
      
      return {
        id: this.uid('s'),
        title: `Sesión ${idx + 1} - ${s?.day || 'Sin día'}`,
        date: new Date().toISOString().slice(0, 10),
        blocks: [
          {
            id: this.uid('b'),
            name: `Sesión ${s?.sessionId || idx + 1}`,
            durationMin: s?.metrics?.durationMinutes || 60,
            notes: s?.goals?.join(', ') || '',
            exercises: exercises.map((e: any) => ({
              id: this.uid('e'),
              name: e?.name || 'Ejercicio sin nombre',
              series: e?.series || 1,
              reps: e?.reps || 1,
              durationMin: e?.durationMinutes || 1,
              intensity: e?.intensity || 'Media',
              restSec: e?.restSeconds || 0,
              material: Array.isArray(e?.material) ? e.material : [],
              notes: [
                e?.type ? `Tipo: ${e.type}` : null,
                e?.phase ? `Fase: ${e.phase}` : null,
                e?.difficulty ? `Dificultad: ${e.difficulty}` : null,
                e?.description ? e.description : null,
              ].filter(Boolean).join(' • '),
            })),
          },
        ],
      };
    });
  }

  markTouched(key: string): void {
    this.touched.add(key);
  }

  hasError(key: string, valid: boolean): boolean {
    return this.touched.has(key) && !valid;
  }

  // --- Session actions ---
  addSession(): void {
    this.sessions.update(sessions => [
      ...sessions,
      {
        id: this.uid('s'),
        title: 'Nueva sesión',
        date: new Date().toISOString().slice(0, 10),
        blocks: [],
      },
    ]);
  }

  removeSession(sessionId: string): void {
    this.confirmation.confirm({
      header: 'Eliminar sesión',
      message: '¿Quieres eliminar esta sesión de la nueva versión?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.sessions.update(sessions => sessions.filter((s) => s.id !== sessionId));
        this.toast.add({ severity: 'success', summary: 'Eliminada', detail: 'Sesión eliminada.' });
      },
    });
  }

  moveSession(sessionId: string, dir: -1 | 1): void {
    const sessions = this.sessions();
    const idx = sessions.findIndex((s) => s.id === sessionId);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= sessions.length) return;
    const copy = [...sessions];
    const [item] = copy.splice(idx, 1);
    copy.splice(next, 0, item);
    this.sessions.set(copy);
  }

  toggleSessionExpanded(sessionId: string): void {
    if (this.expandedSessionIds.has(sessionId)) {
      this.expandedSessionIds.delete(sessionId);
    } else {
      this.expandedSessionIds.add(sessionId);
    }
  }

  isSessionExpanded(sessionId: string): boolean {
    return this.expandedSessionIds.has(sessionId);
  }

  // --- Block actions ---
  addBlock(session: PlanningSessionEditor): void {
    session.blocks = [
      ...session.blocks,
      {
        id: this.uid('b'),
        name: `Bloque ${session.blocks.length + 1}`,
        durationMin: 15,
        notes: '',
        exercises: [],
      },
    ];
    // Trigger signal update to refresh the view
    this.sessions.set([...this.sessions()]);
  }

  removeBlock(session: PlanningSessionEditor, blockId: string): void {
    this.confirmation.confirm({
      header: 'Eliminar bloque',
      message: '¿Quieres eliminar este bloque?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        session.blocks = session.blocks.filter((b) => b.id !== blockId);
        // Trigger signal update to refresh the view
        this.sessions.set([...this.sessions()]);
        this.toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Bloque eliminado.' });
      },
    });
  }

  moveBlock(session: PlanningSessionEditor, blockId: string, dir: -1 | 1): void {
    const idx = session.blocks.findIndex((b) => b.id === blockId);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= session.blocks.length) return;
    const copy = [...session.blocks];
    const [item] = copy.splice(idx, 1);
    copy.splice(next, 0, item);
    session.blocks = copy;
    // Trigger signal update to refresh the view
    this.sessions.set([...this.sessions()]);
  }

  // --- Exercise actions ---
  addExercise(block: PlanningBlockEditor): void {
    block.exercises = [
      ...block.exercises,
      {
        id: this.uid('e'),
        name: `Ejercicio ${block.exercises.length + 1}`,
        series: 3,
        reps: 8,
        durationMin: 10,
        intensity: 'Media',
        restSec: 60,
        material: [],
        notes: '',
      },
    ];
    // Trigger signal update to refresh the view
    this.sessions.set([...this.sessions()]);
  }

  openExerciseSearch(block: PlanningBlockEditor): void {
    this.currentBlockForExercise.set(block);
    this.exerciseSearchDialogOpen.set(true);
    this.exerciseSearchQuery.set('');
    
    if (this.availableExercises().length === 0) {
      this.loadExercises();
    }
  }

  loadExercises(): void {
    this.loadingExercises.set(true);
    this.exercisesApi.list({}).subscribe({
      next: (response) => {
        // El API puede devolver un array directo o un objeto paginado
        this.availableExercises.set(Array.isArray(response) ? response : (response as any).items || []);
        this.loadingExercises.set(false);
      },
      error: (e) => {
        console.error('Error loading exercises:', e);
        this.toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los ejercicios.',
        });
        this.loadingExercises.set(false);
      },
    });
  }

  addExerciseFromDatabase(exercise: ExerciseDto): void {
    const block = this.currentBlockForExercise();
    if (!block) return;

    const durationMin = exercise.duration ? Math.ceil(exercise.duration / 60) : 10;
    const difficulty = String(exercise.difficulty || '');

    block.exercises = [
      ...block.exercises,
      {
        id: this.uid('e'),
        name: exercise.name || 'Ejercicio',
        series: 3,
        reps: 8,
        durationMin,
        intensity: difficulty === 'advanced' ? 'Alta' : difficulty === 'beginner' ? 'Baja' : 'Media',
        restSec: 60,
        material: [],
        notes: exercise.description || '',
      },
    ];

    // Trigger signal update to refresh the view
    this.sessions.set([...this.sessions()]);

    this.toast.add({
      severity: 'success',
      summary: 'Ejercicio añadido',
      detail: `${exercise.name} se ha añadido al bloque.`,
    });
  }

  closeExerciseSearch(): void {
    this.exerciseSearchDialogOpen.set(false);
    this.currentBlockForExercise.set(null);
    this.exerciseSearchQuery.set('');
  }

  addMaterial(ex: PlanningExerciseEditor, material: string): void {
    const m = material.trim();
    if (!m) return;
    ex.material = ex.material.includes(m) ? ex.material : [...ex.material, m];
    // Trigger signal update to refresh the view
    this.sessions.set([...this.sessions()]);
  }

  clearMaterial(ex: PlanningExerciseEditor): void {
    ex.material = [];
    // Trigger signal update to refresh the view
    this.sessions.set([...this.sessions()]);
  }

  removeExercise(block: PlanningBlockEditor, exerciseId: string): void {
    this.confirmation.confirm({
      header: 'Eliminar ejercicio',
      message: '¿Quieres eliminar este ejercicio?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        block.exercises = block.exercises.filter((e) => e.id !== exerciseId);
        // Trigger signal update to refresh the view
        this.sessions.set([...this.sessions()]);
        this.toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Ejercicio eliminado.' });
      },
    });
  }

  moveExercise(block: PlanningBlockEditor, exerciseId: string, dir: -1 | 1): void {
    const idx = block.exercises.findIndex((e) => e.id === exerciseId);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= block.exercises.length) return;
    const copy = [...block.exercises];
    const [item] = copy.splice(idx, 1);
    copy.splice(next, 0, item);
    block.exercises = copy;
    // Trigger signal update to refresh the view
    this.sessions.set([...this.sessions()]);
  }

  // --- Validation ---
  isSessionValid(s: PlanningSessionEditor): boolean {
    return s.title.trim().length > 0;
  }

  isBlockValid(b: PlanningBlockEditor): boolean {
    return b.name.trim().length > 0 && b.durationMin > 0;
  }

  isExerciseValid(e: PlanningExerciseEditor): boolean {
    return (
      e.name.trim().length > 0 &&
      e.series > 0 &&
      e.reps > 0 &&
      e.durationMin > 0 &&
      e.restSec >= 0
    );
  }

  canSave(): boolean {
    if (!this.planningId) return false;
    const sessions = this.sessions();
    if (sessions.length === 0) return false;
    for (const s of sessions) {
      if (!this.isSessionValid(s)) return false;
      for (const b of s.blocks) {
        if (!this.isBlockValid(b)) return false;
        for (const e of b.exercises) {
          if (!this.isExerciseValid(e)) return false;
        }
      }
    }
    return true;
  }

  cancel(): void {
    if (!this.planningId) {
      this.router.navigate(['/planning']);
      return;
    }
    this.router.navigate(['/planning', this.planningId], {
      queryParams: this.fromVersion ? { version: this.fromVersion } : {},
    });
  }

  save(): void {
    if (!this.planningId) return;
    if (!this.canSave()) {
      this.toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'Hay campos obligatorios sin completar.' });
      return;
    }

    this.saveError.set(null);
    this.saving.set(true);

    const payload: any = {
      source: 'manual',
      date: new Date().toISOString(),
      comments: this.fromVersion ? `created-from:${this.fromVersion}` : undefined,
      createdFrom: this.fromVersion ? { fromVersionId: this.fromVersion } : undefined,
      sessions: this.sessions(), // Fixed: send sessions directly, not nested in items
    };

    this.api.createNewVersion(this.planningId, payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        const newVersionId = res?.id != null ? String(res.id) : undefined;
        this.toast.add({ severity: 'success', summary: 'Guardado', detail: 'Nueva versión creada.' });

        this.router.navigate(['/planning', this.planningId], {
          queryParams: newVersionId ? { version: newVersionId } : {},
        });
      },
      error: (e: unknown) => {
        this.saving.set(false);
        const msg = e instanceof Error ? e.message : 'No se pudo guardar la nueva versión.';
        this.saveError.set(msg);
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  // Exercise preview methods
  openExercisePreviewFromSearch(exercise: ExerciseDto): void {
    this.selectedExerciseForPreview.set(exercise);
    this.exercisePreviewDialogOpen.set(true);
  }

  openExercisePreviewFromBlock(exercise: PlanningExerciseEditor): void {
    // Intentar convertir el ID a número si es posible
    const numericId = parseInt(exercise.id);
    
    // Buscar el ejercicio completo en availableExercises si está disponible
    if (!isNaN(numericId)) {
      const fullExercise = this.availableExercises().find(e => e.id === numericId);
      if (fullExercise) {
        this.selectedExerciseForPreview.set(fullExercise);
        this.exercisePreviewDialogOpen.set(true);
        return;
      }
    }
    
    // Si no se encuentra o no tiene ID numérico, crear un objeto temporal con los datos que tenemos
    this.selectedExerciseForPreview.set({
      id: numericId || 0,
      name: exercise.name,
      description: exercise.notes || '',
      type: 'cardio' as any, // Tipo por defecto
      difficulty: {},
      duration: exercise.durationMin * 60, // Convertir minutos a segundos
      tags: {},
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as ExerciseDto);
    
    this.exercisePreviewDialogOpen.set(true);
  }

  closeExercisePreview(): void {
    this.exercisePreviewDialogOpen.set(false);
    this.selectedExerciseForPreview.set(null);
  }

  getDifficultyLabel(key: string): string {
    const labels: Record<string, string> = {
      tactica: 'Táctica',
      tecnica: 'Técnica',
      fisica: 'Física',
      mental: 'Mental'
    };
    return labels[key] || key;
  }

  getDifficultyValue(key: string): number {
    const preview = this.selectedExerciseForPreview();
    if (!preview?.difficulty || typeof preview.difficulty !== 'object') {
      return 0;
    }
    const difficulty = preview.difficulty as any;
    return difficulty[key] || 0;
  }

  getDifficultyKeys(): string[] {
    const preview = this.selectedExerciseForPreview();
    if (!preview?.difficulty || typeof preview.difficulty !== 'object') {
      return [];
    }
    return Object.keys(preview.difficulty);
  }

  calculateAverageDifficulty(difficulty: any): number {
    if (!difficulty || typeof difficulty !== 'object') return 0;
    
    const values = [
      difficulty.tactica,
      difficulty.tecnica,
      difficulty.fisica,
      difficulty.mental
    ].filter(v => typeof v === 'number');
    
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Math.round((sum / values.length) * 10) / 10;
  }

  formatDifficultyShort(difficulty: any): string {
    const avg = this.calculateAverageDifficulty(difficulty);
    return avg > 0 ? avg.toFixed(1) : 'N/A';
  }
}
