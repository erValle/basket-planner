import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ChipModule } from 'primeng/chip';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';
import { PlayerSelectCard } from '../components/player-select-card/player-select-card';
import { BpDialog } from '../components/bp-dialog';
import { GoalSuggestionsDialog } from '../components/goal-suggestions-dialog';

import { PlanningApiService } from '../services/planning.api';
import { PlanningDraft } from '../models/planning';
import { PlayersApi, PlayerDto } from '../services/players.api';
import { TeamsApi, TeamDto } from '../services/teams.api';
import { ClubContextService } from '../core/context/club-context.service';
import { EquipmentApi, EquipmentDto } from '../services/equipment.api';
import { ClubResourcesStore } from '../core/stores/club-resources.store';
import { GoalSuggestion } from '../models/recommender';

import {
  OBJECTIVE_OPTIONS,
  INTENSITY_OPTIONS,
  POSITION_OPTIONS,
  CATEGORY_OPTIONS,
  PLANNING_MODE_OPTIONS,
  NEW_PLANNING_STEPS,
  DEFAULT_PLANNING_FORM,
  SelectOption,
} from '../constants/planning-options';

type Option = { label: string; value: string };

@Component({
  selector: 'app-new-planification',
  imports: [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
		ChipModule,
		CheckboxModule,
		BpDialog,
		ToastModule,
		ConfirmDialogModule,
		AppShell,
		PageHeader,
    PlayerSelectCard,
    GoalSuggestionsDialog,
  ],
  templateUrl: './new-planification.html',
  styleUrl: './new-planification.scss',
  providers: [MessageService, ConfirmationService],
})
export class NewPlanification {
  currentStep = 1;

  readonly steps = NEW_PLANNING_STEPS;
  readonly objectiveOptions = OBJECTIVE_OPTIONS;
  readonly intensityOptions = INTENSITY_OPTIONS;
  readonly positionOptions = POSITION_OPTIONS;
  readonly categoryOptions = CATEGORY_OPTIONS;
  readonly modeOptions = PLANNING_MODE_OPTIONS;

  formData = { ...DEFAULT_PLANNING_FORM };

  // Step 2 - Destino
  planningMode: 'individual' | 'group' = 'individual';

  onPlanningModeChange(mode: 'individual' | 'group'): void {
    this.planningMode = mode;

    // Reset selections that don't make sense across modes to avoid validation/UI glitches.
    this.selectedPlayerId = null;
    this.selectedGroupId = null;
    this.selectedPlayerIds = [];

    // Reset filters so the group list renders immediately and predictably.
    this.filterName = '';
    this.filterPosition = null;
    this.filterCategory = null;
    this.filterTeam = null;

    this.syncWizardQueryParams();
  }

  // Options can be derived from loaded players (kept for potential dropdown usage).
  playerOptions: Option[] = [];

  teamOptions: Array<{ label: string; value: string }> = [];

  // Filters state
  filterName = '';
  filterPosition: string | null = null;
  filterCategory: string | null = null;
  filterTeam: string | null = null;

  // Multi-select (group) support
  selectedPlayerIds: string[] = [];

  get selectedPlayers() {
    const selected = new Set(this.selectedPlayerIds);
    return this.players.filter((p) => selected.has(p.id));
  }

  togglePlayerSelection(playerId: string): void {
    const exists = this.selectedPlayerIds.includes(playerId);
    this.selectedPlayerIds = exists
      ? this.selectedPlayerIds.filter((id) => id !== playerId)
      : [...this.selectedPlayerIds, playerId];
  }

  // Players loaded from backend (id is real userId). teamId is used for precise filtering.
  players: Array<{ id: string; name: string; position?: string; category?: string; team?: string; teamId?: string }> = [];

  // Step 2 UX helpers (until players come from API)
  playersLoading = false;
  playersError: string | null = null;

  // Option A: render immediately and fill sections progressively.
  pageLoading = true;

  private toUiPlayer(
    p: PlayerDto,
  ): { id: string; name: string; position?: string; category?: string; team?: string; teamId?: string } {
    const rawName = (p.name ?? '').toString().trim();
    const email = (p.email ?? '').toString().trim();
    const fallbackName = `${(p.firstName ?? '').toString().trim()} ${(p.lastName ?? '').toString().trim()}`.trim();
    const name = rawName || fallbackName || email || `Jugador ${p.id}`;

  const firstTeam = Array.isArray(p.teams) && p.teams.length ? p.teams[0] : null;

    return {
      id: String(p.id),
      name,
      position: (p.position ?? '').toString() || undefined,
      category: (p.category ?? firstTeam?.category ?? '').toString() || undefined,
      team: firstTeam?.name ? String(firstTeam.name) : undefined,
      teamId: firstTeam?.id != null ? String(firstTeam.id) : undefined,
    };
  }

  private loadTeams(): void {
    const clubId = this.clubContext.getSelectedClubIdSnapshot();
    this.clubResources.teams$(clubId).subscribe({
      next: (teams: TeamDto[]) => {
        this.teamOptions = (teams ?? []).map((t) => ({ label: t.name, value: String(t.id) }));
      },
      error: () => {
        this.teamOptions = [];
      },
    });
  }

  private loadPlayers(): void {
    this.playersLoading = true;
    this.playersError = null;
    this.playersApi.list({ limit: 200 }).subscribe({
      next: (items) => {
        this.playersLoading = false;
        this.players = (items ?? []).map((p) => this.toUiPlayer(p));
        this.playerOptions = this.players.map((p) => ({ label: p.name, value: p.id }));
      },
      error: (e: unknown) => {
        this.playersLoading = false;
        this.playersError = e instanceof Error ? e.message : 'No se pudieron cargar los jugadores.';
        this.players = [];
        this.playerOptions = [];
      },
    });
  }

  get hasFilteredPlayers(): boolean {
    return this.filteredPlayers.length > 0;
  }

  clearPlayerFilters(): void {
    this.filterName = '';
    this.filterPosition = null;
    this.filterCategory = null;
    this.filterTeam = null;
  }

  get filteredPlayers() {
    return this.players.filter((p) => {
      if (this.filterName && !p.name.toLowerCase().includes(this.filterName.toLowerCase())) return false;
      if (this.filterPosition && p.position !== this.filterPosition) return false;
      if (this.filterCategory && p.category !== this.filterCategory) return false;
      if (this.filterTeam && p.teamId !== this.filterTeam) return false;
      return true;
    });
  }

  get playerOptionsFiltered(): Option[] {
    return this.filteredPlayers.map((p) => ({ label: p.name, value: p.id }));
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly planningApi: PlanningApiService,
    private readonly toast: MessageService,
    private readonly confirmation: ConfirmationService,
    private readonly playersApi: PlayersApi,
    private readonly teamsApi: TeamsApi,
    private readonly clubContext: ClubContextService,
    private readonly equipmentApi: EquipmentApi,
    private readonly clubResources: ClubResourcesStore,
  ) {
	this.loadTeams();
	this.loadPlayers();
	this.loadMaterials();

    // Restore & keep wizard state in sync with query params.
    // This avoids a "needs one extra click" situation when landing directly on
    // /planning/new?step=2&mode=group.
    this.route.queryParamMap
      .pipe(
        map((p) => {
          const step = Number(p.get('step') ?? '1');
          const rawMode = p.get('mode');
          const mode: 'individual' | 'group' | null = rawMode === 'individual' || rawMode === 'group' ? rawMode : null;
          return {
            step: Number.isNaN(step) ? null : Math.min(this.steps.length, Math.max(1, step)),
            mode,
          };
        }),
        distinctUntilChanged((a, b) => a.step === b.step && a.mode === b.mode),
      )
      .subscribe(({ step, mode }) => {
        if (step != null) this.currentStep = step;

        // Use the same state reset logic as the manual mode switch.
        // Notice: we intentionally DO NOT call syncWizardQueryParams() here to
        // avoid navigation loops on initial load.
        if (mode && mode !== this.planningMode) {
          this.planningMode = mode;
          this.selectedPlayerId = null;
          this.selectedGroupId = null;
          this.selectedPlayerIds = [];
          this.filterName = '';
          this.filterPosition = null;
          this.filterCategory = null;
          this.filterTeam = null;
        }
      });

    // Reload club-scoped data when the selected club changes.
    this.clubContext.selectedClubId$.subscribe(() => {
      this.loadTeams();
      this.loadMaterials();
    });
  }

  syncWizardQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        step: this.currentStep,
        mode: this.planningMode,
      },
      queryParamsHandling: 'merge',
    });
  }

  groupOptions: Option[] = [
    { label: 'Senior Masculino (equipo completo)', value: 'group-senior-m' },
    { label: 'Bases', value: 'group-bases' },
    { label: 'Interiores', value: 'group-interiores' },
  ];

  selectedPlayerId: string | null = null;
  selectedGroupId: string | null = null;

  selectedTargetLabel(): string {
    const options = this.planningMode === 'individual' ? this.playerOptions : this.groupOptions;
    const selected = this.planningMode === 'individual' ? this.selectedPlayerId : this.selectedGroupId;
    return options.find((o) => o.value === selected)?.label ?? '—';
  }

  // Step 3 - Restricciones
  materialOptions: Array<{ id: string; label: string }> = [];

  materialLoading = false;
  materialError: string | null = null;

  selectedMaterials = new Set<string>();
  // Use a map for two-way binding with PrimeNG checkboxes
  materialSelectedMap: Record<string, boolean> = {};
  restrictionTagsInput = '';
  restrictionTags: string[] = [];
  tagsControl = new FormControl('');

	private normalizeTag(raw: string): string {
		return raw.trim();
	}

	addTag(raw: string): void {
		const tag = this.normalizeTag(raw);
		if (!tag) return;
		if (this.restrictionTags.includes(tag)) return;
		this.restrictionTags = [...this.restrictionTags, tag];
	}

  syncRestrictionTags(): void {
		// Accept comma-separated input but APPEND into the array (do not replace it)
    const raw = (this.tagsControl?.value ?? this.restrictionTagsInput) as string;
    raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
			.forEach((t) => this.addTag(t));
  }

  addTagFromInput(e: any) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    this.syncRestrictionTags();
    this.tagsControl.setValue('');
  }

  addTagManually() {
    this.syncRestrictionTags();
    this.tagsControl.setValue('');
  }

  removeTag(tag: string) {
    this.restrictionTags = this.restrictionTags.filter((t) => t !== tag);
  }

  isMaterialSelected(id: string): boolean {
    return !!this.materialSelectedMap[id];
  }

  toggleMaterial(id: string, checked: boolean): void {
    this.materialSelectedMap[id] = checked;
    if (checked) this.selectedMaterials.add(id);
    else this.selectedMaterials.delete(id);
  }

  private toMaterialOption(e: EquipmentDto): { id: string; label: string } {
    return { id: String(e.id), label: String(e.name ?? `Material ${e.id}`) };
  }

  private syncMaterialSelectedMap(nextOptions: Array<{ id: string; label: string }>): void {
    const nextMap: Record<string, boolean> = {};
    for (const opt of nextOptions) {
      nextMap[opt.id] = this.materialSelectedMap[opt.id] === true;
    }
    this.materialSelectedMap = nextMap;

    // Drop selected ids that are no longer present (e.g. club changes).
    this.selectedMaterials = new Set(Array.from(this.selectedMaterials).filter((id) => nextMap[id] === true));
  }

  private loadMaterials(): void {
    const clubId = this.clubContext.getSelectedClubIdSnapshot();

    this.pageLoading = true;

    this.materialLoading = true;
    this.materialError = null;

    this.clubResources.equipment$(clubId).subscribe({
      next: (items) => {
        this.materialLoading = false;
        const options = (items ?? []).map((e) => this.toMaterialOption(e));
        this.materialOptions = options;
        this.syncMaterialSelectedMap(options);
        this.pageLoading = false;
      },
      error: (e: unknown) => {
        this.materialLoading = false;
        this.materialOptions = [];
        this.materialSelectedMap = {};
        this.selectedMaterials = new Set();
        this.materialError = e instanceof Error ? e.message : 'No se pudo cargar el material del club.';
        this.pageLoading = false;
      },
    });
  }

  get selectedMaterialLabels(): string[] {
    return this.materialOptions
      .filter((m) => this.selectedMaterials.has(m.id))
      .map((m) => m.label);
  }

  // Validation / navigation
  stepIsValid(step: number): boolean {
    if (step === 1) {
      return this.formData.name.trim().length > 0 && this.formData.duration >= 10;
    }
    if (step === 2) {
			if (this.planningMode === 'individual') return !!this.selectedPlayerId;
			// grupal: selección manual
			return this.selectedPlayerIds.length > 0 || !!this.selectedGroupId;
    }
    // Step 3 and 4: optional, always valid
    return true;
  }

  canGoNext(): boolean {
    return this.stepIsValid(this.currentStep);
  }

  cancel() {
    this.router.navigate(['/planning']);
  }

  back() {
    this.currentStep = Math.max(1, this.currentStep - 1);
    this.syncWizardQueryParams();
  }

  next() {
    // Make sure we capture latest tag input before leaving the step.
    if (this.currentStep === 3) {
      this.syncRestrictionTags();
    }

    if (!this.canGoNext()) return;
    this.currentStep = Math.min(this.steps.length, this.currentStep + 1);
		this.syncWizardQueryParams();
  }

	confirm() {
    this.confirmation.confirm({
      header: 'Confirmar generación',
      message: '¿Quieres generar la sesión con estos parámetros?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Generar',
      rejectLabel: 'Cancelar',
      accept: () => this.generate(),
    });
	}

  // UI states required across screens
  saving = false;
  saveError: string | null = null;

  completedDialogVisible = false;
  generatedResultId: string | null = null;

  // Goal suggestions dialog (managed by child component)
  suggestionsDialogVisible = false;

  openSuggestionsDialog(): void {
    this.suggestionsDialogVisible = true;
  }

  applySuggestion(suggestion: GoalSuggestion): void {
    // Mapear el goal del backend al label del frontend
    const matchingOption = this.objectiveOptions.find(opt => 
      opt.label.toLowerCase().includes(suggestion.label.toLowerCase()) ||
      suggestion.label.toLowerCase().includes(opt.label.toLowerCase())
    );
    
    if (matchingOption && !matchingOption.disabled) {
      (this.formData as { objective: string }).objective = matchingOption.value;
      this.suggestionsDialogVisible = false;
      this.toast.add({
        severity: 'info',
        summary: 'Objetivo aplicado',
        detail: `Se ha seleccionado: ${matchingOption.label}`,
      });
    }
  }

  private buildDraft(): PlanningDraft {
    // make sure tags reflect the latest input before sending
    this.syncRestrictionTags();

    const materialIds = Object.entries(this.materialSelectedMap)
      .filter(([, selected]) => !!selected)
      .map(([id]) => id);

    // Get the equipment names for the selected IDs
    const materialNames = this.materialOptions
      .filter((m) => this.materialSelectedMap[m.id])
      .map((m) => m.label);

    return {
      name: this.formData.name,
      duration: this.formData.duration,
      sessionsCount: this.formData.sessionsCount,
      summary: this.formData.summary,
      objective: this.formData.objective,
      intensity: this.formData.intensity,
      mode: this.planningMode,
      playerId: this.planningMode === 'individual' ? this.selectedPlayerId : null,
      playerIds: this.planningMode === 'group' ? this.selectedPlayerIds : [],
      groupId: this.planningMode === 'group' ? this.selectedGroupId : null,
      materialIds,
      materialNames,
      tags: this.restrictionTags,
    };
  }

  private generate(): void {
    this.saveError = null;
    this.saving = true;
    const draft = this.buildDraft();

    this.planningApi.generate(draft).subscribe({
      next: (res) => {
        this.saving = false;
        this.generatedResultId = res?.id ?? null;
        this.toast.add({
          severity: 'success',
          summary: 'Sesión generada',
          detail: 'La propuesta se ha generado correctamente.',
        });
        this.completedDialogVisible = true;
      },
      error: (e: unknown) => {
        this.saving = false;
        const msg = e instanceof Error ? e.message : 'No se pudo generar la sesión.';
        this.saveError = msg;
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  goToPlanifications() {
    this.completedDialogVisible = false;
    this.router.navigate(['/planning']);
  }
}
