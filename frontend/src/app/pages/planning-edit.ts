import { Component, inject } from '@angular/core';
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
import { ConfirmationService, MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';

import { PlanningApiService } from '../services/planning.api';
import {
  PlanningBlockEditor,
  PlanningExerciseEditor,
  PlanningSessionEditor,
} from '../models/planning';
import { ClubContextService } from '../core/context/club-context.service';
import { TeamsApi, TeamDto } from '../services/teams.api';

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

  teams: TeamDto[] = [];
  teamOptions: Option[] = [];
  selectedTeamId: string | null = null;

  planningId: string | null = null;
  fromVersion: string | null = null;

  saving = false;
  saveError: string | null = null;

  intensityOptions: Option[] = [
    { label: 'Baja', value: 'Baja' },
    { label: 'Media', value: 'Media' },
    { label: 'Alta', value: 'Alta' },
  ];

  // Editor state
  sessions: PlanningSessionEditor[] = [];

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
      this.loadTeams();
    });

    this.route.paramMap.subscribe((p) => {
      this.planningId = p.get('id');
      this.fromVersion = this.route.snapshot.queryParamMap.get('fromVersion');
      this.bootstrapDraft();
    });

    this.loadTeams();
  }

  private loadTeams(): void {
    const clubId = this.clubContext.getSelectedClubIdSnapshot();
    this.teamsApi.list({ clubId: clubId != null ? String(clubId) : undefined }).subscribe({
      next: (items) => {
        this.teams = items ?? [];
        this.teamOptions = this.teams.map((t) => ({ label: t.name, value: String(t.id) }));

        // Default to first team if none selected.
        if (!this.selectedTeamId && this.teamOptions.length) {
          this.selectedTeamId = this.teamOptions[0].value;
        }
      },
      error: () => {
        this.teams = [];
        this.teamOptions = [];
        this.selectedTeamId = null;
      },
    });
  }

  private uid(prefix: string): string {
    return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
  }

  private bootstrapDraft(): void {
    // Frontend-only: we start with a simple template; later we can map from PlanningApiService.get(fromVersion)
    // when the backend exposes version data.
    this.sessions = [
      {
        id: this.uid('s'),
        title: `Sesión nueva (${this.fromVersion ?? 'clon'})`,
        date: new Date().toISOString().slice(0, 10),
        blocks: [
          {
            id: this.uid('b'),
            name: 'Bloque 1',
            durationMin: 15,
            notes: '',
            exercises: [
              {
                id: this.uid('e'),
                name: 'Ejercicio 1',
                series: 3,
                reps: 8,
                durationMin: 10,
                intensity: 'Media',
                restSec: 60,
                material: [],
                notes: '',
              },
            ],
          },
        ],
      },
    ];
  }

  markTouched(key: string): void {
    this.touched.add(key);
  }

  hasError(key: string, valid: boolean): boolean {
    return this.touched.has(key) && !valid;
  }

  // --- Session actions ---
  addSession(): void {
    this.sessions = [
      ...this.sessions,
      {
        id: this.uid('s'),
        title: 'Nueva sesión',
        date: new Date().toISOString().slice(0, 10),
        blocks: [],
      },
    ];
  }

  removeSession(sessionId: string): void {
    this.confirmation.confirm({
      header: 'Eliminar sesión',
      message: '¿Quieres eliminar esta sesión de la nueva versión?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.sessions = this.sessions.filter((s) => s.id !== sessionId);
        this.toast.add({ severity: 'success', summary: 'Eliminada', detail: 'Sesión eliminada.' });
      },
    });
  }

  moveSession(sessionId: string, dir: -1 | 1): void {
    const idx = this.sessions.findIndex((s) => s.id === sessionId);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= this.sessions.length) return;
    const copy = [...this.sessions];
    const [item] = copy.splice(idx, 1);
    copy.splice(next, 0, item);
    this.sessions = copy;
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
  }

  addMaterial(ex: PlanningExerciseEditor, material: string): void {
    const m = material.trim();
    if (!m) return;
    ex.material = ex.material.includes(m) ? ex.material : [...ex.material, m];
  }

  clearMaterial(ex: PlanningExerciseEditor): void {
    ex.material = [];
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
    if (this.sessions.length === 0) return false;
    for (const s of this.sessions) {
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

    this.saveError = null;
    this.saving = true;

    const payload: any = {
      source: 'manual',
      date: new Date().toISOString(),
      comments: this.fromVersion ? `created-from:${this.fromVersion}` : undefined,
      createdFrom: this.fromVersion ? { fromVersionId: this.fromVersion } : undefined,
      items: {
        sessions: this.sessions,
      },
    };

    this.api.createNewVersion(this.planningId, payload).subscribe({
      next: (res) => {
        this.saving = false;
        const newVersionId = res?.id != null ? String(res.id) : undefined;
        this.toast.add({ severity: 'success', summary: 'Guardado', detail: 'Nueva versión creada.' });

        this.router.navigate(['/planning', this.planningId], {
          queryParams: newVersionId ? { version: newVersionId } : {},
        });
      },
      error: (e: unknown) => {
        this.saving = false;
        const msg = e instanceof Error ? e.message : 'No se pudo guardar la nueva versión.';
        this.saveError = msg;
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
