import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { SliderModule } from 'primeng/slider';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ChipModule } from 'primeng/chip';

import { MaterialSelection } from '../../modals/material-selection/material-selection';
import { EquipmentApi, EquipmentDto } from '../../services/equipment.api';

export interface ExerciseFormValue {
  nombre: string;
  descripcion: string;
  tipo: string;
  estado: 'Activo' | 'Inactivo';
  // 4 dimensiones de dificultad (1-5)
  dificultadTactica: number;
  dificultadTecnica: number;
  dificultadFisica: number;
  dificultadMental: number;
  duracionSegundos: number;
  etiquetas: string[];
  materialesNecesarios: string[];
  observaciones: string;
}

export type ExerciseDraft = Partial<ExerciseFormValue> & { id?: string };

type Option = { label: string; value: string };

@Component({
  selector: 'app-exercise-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    TagModule,
    SliderModule,
    AutoCompleteModule,
    ChipModule,
    MaterialSelection,
  ],
  templateUrl: './exercise-form.html',
  styleUrl: './exercise-form.css',
})
export class ExerciseForm implements OnChanges {
  private fb = inject(FormBuilder);
  private equipmentApi = inject(EquipmentApi);

  @Input() initialValue: ExerciseDraft | null = null;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<ExerciseFormValue>();

  // Make Math available in template
  Math = Math;

  get isViewMode(): boolean {
    return this.mode === 'view';
  }

  stepIndex = 0;
  materialModalVisible = false;
  equipmentLoading = false;
  equipmentError: string | null = null;
  equipmentItems: EquipmentDto[] = [];

  get availableEquipmentForModal(): Array<{ id: number; name: string }> {
    return (this.equipmentItems ?? []).map((e) => ({ id: Number(e.id), name: String(e.name ?? '') }));
  }

  // Títulos EXACTOS usados en el mockup para separar las secciones del formulario
  readonly steps = [
    { id: 'basic', title: 'Información básica' },
    { id: 'difficulty', title: 'Niveles de dificultad' },
    { id: 'tags', title: 'Etiquetas y materiales' },
    { id: 'notes', title: 'Observaciones' },
  ] as const;

  // Tipos específicos de baloncesto (20+ tipos)
  readonly tipoOptions: Option[] = [
    { label: 'Selecciona', value: '' },
    { label: 'Técnica de bote', value: 'TECNICA_BOTE' },
    { label: 'Finalización al aro', value: 'FINALIZACION_ARO' },
    { label: 'Tiro', value: 'TIRO' },
    { label: 'Pase', value: 'PASE' },
    { label: 'Táctica de ataque', value: 'TACTICA_ATAQUE' },
    { label: 'Táctica ataque-defensa', value: 'TACTICA_ATAQUE_DEFENSA' },
    { label: 'Defensa en equipo', value: 'DEFENSA_EQUIPO' },
    { label: 'Defensa individual', value: 'DEFENSA_INDIVIDUAL' },
    { label: 'Fundamentos defensivos', value: 'DEFENSA_FUNDAMENTOS' },
    { label: 'Rebote', value: 'REBOTE' },
    { label: 'Técnica de poste', value: 'TECNICA_POSTE' },
    { label: 'Ataque individual', value: 'ATAQUE_INDIVIDUAL' },
    { label: 'Técnica de pies', value: 'TECNICA_PIES' },
    { label: 'Condicionamiento físico', value: 'CONDICIONAMIENTO_FISICO' },
    { label: 'Movilidad y recuperación', value: 'MOVILIDAD_RECUPERACION' },
    { label: 'Táctica de transición', value: 'TACTICA_TRANSICION' },
    { label: 'ABP y saques', value: 'ABP_SAQUES' },
    { label: 'Juego reducido', value: 'JUEGO_REDUCIDO' },
  ];

  readonly estadoOptions: Option[] = [
    { label: 'Activo', value: 'Activo' },
    { label: 'Inactivo', value: 'Inactivo' },
  ];

  // Etiquetas sugeridas para autocompletado
  readonly etiquetasSugeridas = [
    'bote', 'tiro', 'pase', 'defensa', 'finalizacion',
    'control', 'precision', 'coordinacion', 'agilidad',
    'pick_and_roll', 'bloqueo_directo', 'backdoor',
    'contraataque', 'transicion', 'spacing', 'cortes',
    'rebote', 'box_out', 'contacto', 'posicion',
    'poste', 'footwork', 'pivotes', 'drop_step',
    'fundamentos', 'mecanica', 'repeticion', '1v1',
    'closeout', 'help_defense', 'comunicacion',
    'catch_and_shoot', 'pull_up', 'tiro_libre',
    'bandeja', 'eurostep', 'reverso', 'floater',
  ];

  // Materiales sugeridos
  readonly materialesSugeridos = [
    'balon', 'canasta', 'conos', '2_balones',
    'foam_pad', 'banda_elastica', 'cajon_pliometria',
    'foam_roller', 'petos', 'pizarra_tactica',
    'rebotador_o_companero', 'cronometro_o_app',
    'silbato_o_app_senal', 'tarjetas_colores', 'colchoneta',
  ];

  // Para autocompletado de etiquetas y materiales
  filteredTags: string[] = [];
  filteredMaterials: string[] = [];
  selectedTag = '';
  selectedMaterial = '';

  form = this.fb.nonNullable.group({
    // Step 1: Información básica
    nombre: this.fb.nonNullable.control('', [Validators.required]),
    descripcion: this.fb.nonNullable.control(''),
    tipo: this.fb.nonNullable.control('', [Validators.required]),
    estado: this.fb.nonNullable.control<'Activo' | 'Inactivo'>('Activo'),
    duracionSegundos: this.fb.nonNullable.control(300, [Validators.required, Validators.min(30)]),

    // Step 2: Dificultades (4 dimensiones, escala 1-5)
    dificultadTactica: this.fb.nonNullable.control(3, [Validators.required, Validators.min(1), Validators.max(5)]),
    dificultadTecnica: this.fb.nonNullable.control(3, [Validators.required, Validators.min(1), Validators.max(5)]),
    dificultadFisica: this.fb.nonNullable.control(3, [Validators.required, Validators.min(1), Validators.max(5)]),
    dificultadMental: this.fb.nonNullable.control(3, [Validators.required, Validators.min(1), Validators.max(5)]),

    // Step 3: Etiquetas y materiales
    etiquetas: this.fb.nonNullable.control<string[]>([]),
    materialesNecesarios: this.fb.nonNullable.control<string[]>([]),

    // Step 4: Observaciones
    observaciones: this.fb.nonNullable.control(''),
  });

  ngOnChanges(): void {
    if (!this.initialValue) return;
    this.form.patchValue({
      nombre: this.initialValue.nombre ?? '',
      descripcion: this.initialValue.descripcion ?? '',
      tipo: this.initialValue.tipo ?? '',
      estado: (this.initialValue.estado as 'Activo' | 'Inactivo') ?? 'Activo',
      duracionSegundos: this.initialValue.duracionSegundos ?? 300,
      dificultadTactica: this.initialValue.dificultadTactica ?? 3,
      dificultadTecnica: this.initialValue.dificultadTecnica ?? 3,
      dificultadFisica: this.initialValue.dificultadFisica ?? 3,
      dificultadMental: this.initialValue.dificultadMental ?? 3,
      etiquetas: this.initialValue.etiquetas ?? [],
      materialesNecesarios: this.initialValue.materialesNecesarios ?? [],
      observaciones: this.initialValue.observaciones ?? '',
    });

    // In view mode we disable the entire form.
    if (this.mode === 'view') this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
  }

  ngOnInit(): void {
    if (this.mode === 'view') this.form.disable({ emitEvent: false });

    // Load equipment list so material selection uses real inventory.
    // If it fails, the modal will fall back to its internal default list.
    this.equipmentLoading = true;
    this.equipmentError = null;
    this.equipmentApi.list({ limit: 200 } as any).subscribe({
      next: (items) => {
        this.equipmentLoading = false;
        this.equipmentItems = items ?? [];
      },
      error: (e: unknown) => {
        this.equipmentLoading = false;
        this.equipmentError = e instanceof Error ? e.message : 'No se pudo cargar el material.';
        this.equipmentItems = [];
      },
    });
  }

  get availableMaterials(): string[] {
    // Use real equipment names when available.
    const fromApi = (this.equipmentItems ?? [])
      .map((e) => (e?.name ?? '').toString().trim())
      .filter((x) => x.length > 0);
    return Array.from(new Set(fromApi));
  }

  isStepActive(idx: number): boolean {
    return idx === this.stepIndex;
  }

  canGoPrev(): boolean {
    return this.stepIndex > 0;
  }

  canGoNext(): boolean {
    return this.stepIndex < this.steps.length - 1;
  }

  goPrev(): void {
    if (!this.canGoPrev()) return;
    this.stepIndex -= 1;
  }

  goNext(): void {
    if (!this.canGoNext()) return;
    this.stepIndex += 1;
  }

  goToStep(idx: number): void {
    if (idx < 0 || idx >= this.steps.length) return;
    this.stepIndex = idx;
  }

  // Métodos para autocompletado de etiquetas
  searchTags(event: any): void {
    const query = event.query.toLowerCase();
    this.filteredTags = this.etiquetasSugeridas.filter(tag => 
      tag.toLowerCase().includes(query)
    );
  }

  addTag(event: any): void {
    const tag = typeof event === 'string' ? event : event.value;
    const current = this.form.controls.etiquetas.value;
    if (!current.includes(tag)) {
      this.form.controls.etiquetas.setValue([...current, tag]);
    }
    this.selectedTag = '';
  }

  removeTag(tag: string): void {
    const current = this.form.controls.etiquetas.value;
    this.form.controls.etiquetas.setValue(current.filter((t: string) => t !== tag));
  }

  // Métodos para autocompletado de materiales
  searchMaterials(event: any): void {
    const query = event.query.toLowerCase();
    this.filteredMaterials = this.materialesSugeridos.filter(material => 
      material.toLowerCase().includes(query)
    );
  }

  addMaterial(event: any): void {
    const material = typeof event === 'string' ? event : event.value;
    const current = this.form.controls.materialesNecesarios.value;
    if (!current.includes(material)) {
      this.form.controls.materialesNecesarios.setValue([...current, material]);
    }
    this.selectedMaterial = '';
  }

  removeMaterial(material: string): void {
    const current = this.form.controls.materialesNecesarios.value;
    this.form.controls.materialesNecesarios.setValue(current.filter((m: string) => m !== material));
  }

  // Convertidor de segundos a minutos para mostrar
  get duracionEnMinutos(): number {
    return Math.round(this.form.controls.duracionSegundos.value / 60);
  }

  openMaterialModal(): void {
    this.materialModalVisible = true;
  }

  onMaterialsConfirmed(materials: string[]): void {
    this.form.controls.materialesNecesarios.setValue(materials);
  }

  onEquipmentConfirmed(items: Array<{ equipmentId: number; name: string; quantity: number }>): void {
    // Extraer nombres de materiales
    const names = (items ?? [])
      .map((x) => (x?.name ?? '').toString().trim())
      .filter((x) => x.length > 0);
    this.form.controls.materialesNecesarios.setValue(Array.from(new Set(names)));
  }

  // Helper para obtener el label del tipo seleccionado
  getTipoLabel(value: string): string {
    const option = this.tipoOptions.find(opt => opt.value === value);
    return option?.label || value;
  }

  // Helper para obtener el label del estado seleccionado
  getEstadoLabel(value: string): string {
    const option = this.estadoOptions.find(opt => opt.value === value);
    return option?.label || value;
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onSubmit(): void {
    if (this.mode === 'view') return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue());
  }

  titleForSave(): string {
    if (this.mode === 'view') return 'Cerrar';
    return this.mode === 'edit' ? 'Guardar cambios' : 'Guardar ejercicio';
  }
}
