import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';

import { MaterialSelection } from '../../modals/material-selection/material-selection';
import { EquipmentApi, EquipmentDto } from '../../services/equipment.api';

export interface ExerciseFormValue {
  nombre: string;
  descripcion: string;
  tipo: string;
  estado: 'Activo' | 'Inactivo';
  subtipo: string[];
  nivelDificultad: string;
  duracionPredeterminada: number;
  intensidad: string;
  objetivoPrincipal: string;
  numeroJugadores: number;
  categoriaRecomendada: string[];
  materialNecesario: string[];
  materialEquipo?: Array<{ equipmentId: number; name: string; quantity: number }>;
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
    ButtonModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    TagModule,
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
    { id: 'params', title: 'Parámetros del ejercicio' },
    { id: 'category', title: 'Categoría recomendada' },
    { id: 'material', title: 'Material necesario' },
    { id: 'notes', title: 'Observaciones' },
  ] as const;

  readonly subtipoOptions = [
    'Tiro',
    'Pase',
    'Bote',
    'Defensa individual',
    'Defensa colectiva',
    'Ataque en estático',
    'Contraataque',
    'Fuerza',
    'Resistencia',
    'Velocidad',
    'Coordinación',
  ];

  readonly categoriaOptions = ['Infantil', 'Cadete', 'Junior', 'Senior'];

  readonly tipoOptions: Option[] = [
    { label: 'Selecciona', value: '' },
    { label: 'Técnico', value: 'Técnico' },
    { label: 'Táctico', value: 'Táctico' },
    { label: 'Físico', value: 'Físico' },
  ];

  readonly estadoOptions: Option[] = [
    { label: 'Activo', value: 'Activo' },
    { label: 'Inactivo', value: 'Inactivo' },
  ];

  readonly dificultadOptions: Option[] = [
    { label: 'Selecciona', value: '' },
    { label: 'Bajo', value: 'Bajo' },
    { label: 'Medio', value: 'Medio' },
    { label: 'Alto', value: 'Alto' },
  ];

  readonly intensidadOptions: Option[] = [
    { label: 'Selecciona', value: '' },
    { label: 'Baja', value: 'Baja' },
    { label: 'Media', value: 'Media' },
    { label: 'Alta', value: 'Alta' },
  ];

  readonly objetivoOptions: Option[] = [
    { label: 'Selecciona', value: '' },
    { label: 'Mejora técnica', value: 'Mejora técnica' },
    { label: 'Mejora táctica', value: 'Mejora táctica' },
    { label: 'Preparación física', value: 'Preparación física' },
    { label: 'Recuperación activa', value: 'Recuperación activa' },
  ];

  form = this.fb.nonNullable.group({
    // Step 1
    nombre: this.fb.nonNullable.control('', [Validators.required]),
    descripcion: this.fb.nonNullable.control(''),
    tipo: this.fb.nonNullable.control(''),
    estado: this.fb.nonNullable.control<'Activo' | 'Inactivo'>('Activo'),
    subtipo: this.fb.nonNullable.control<string[]>([]),

    // Step 2
    nivelDificultad: this.fb.nonNullable.control(''),
    duracionPredeterminada: this.fb.nonNullable.control(15),
    intensidad: this.fb.nonNullable.control(''),
    objetivoPrincipal: this.fb.nonNullable.control(''),
    numeroJugadores: this.fb.nonNullable.control(10),

    // Step 3
    categoriaRecomendada: this.fb.nonNullable.control<string[]>([]),

    // Step 4
    materialNecesario: this.fb.nonNullable.control<string[]>([]),
  materialEquipo: this.fb.nonNullable.control<Array<{ equipmentId: number; name: string; quantity: number }>>([]),

    // Step 5
    observaciones: this.fb.nonNullable.control(''),
  });

  ngOnChanges(): void {
    if (!this.initialValue) return;
    this.form.patchValue({
      nombre: this.initialValue.nombre ?? '',
      descripcion: this.initialValue.descripcion ?? '',
      tipo: this.initialValue.tipo ?? '',
      estado: (this.initialValue.estado as 'Activo' | 'Inactivo') ?? 'Activo',
      subtipo: this.initialValue.subtipo ?? [],
      nivelDificultad: this.initialValue.nivelDificultad ?? '',
      duracionPredeterminada: this.initialValue.duracionPredeterminada ?? 15,
      intensidad: this.initialValue.intensidad ?? '',
      objetivoPrincipal: this.initialValue.objetivoPrincipal ?? '',
      numeroJugadores: this.initialValue.numeroJugadores ?? 10,
      categoriaRecomendada: this.initialValue.categoriaRecomendada ?? [],
      materialNecesario: this.initialValue.materialNecesario ?? [],
      materialEquipo: this.initialValue.materialEquipo ?? [],
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

  toggleInArrayControl(controlName: 'subtipo' | 'categoriaRecomendada', value: string): void {
    const control = this.form.controls[controlName];
    const current = control.value;
    control.setValue(current.includes(value) ? current.filter((x) => x !== value) : [...current, value]);
  }

  removeMaterial(material: string): void {
    const current = this.form.controls.materialNecesario.value;
    this.form.controls.materialNecesario.setValue(current.filter((m) => m !== material));
  }

  removeEquipment(equipmentId: number): void {
    const id = Number(equipmentId);
    const current = this.form.controls.materialEquipo.value;
    this.form.controls.materialEquipo.setValue(current.filter((row) => Number(row.equipmentId) !== id));
  }

  openMaterialModal(): void {
    this.materialModalVisible = true;
  }

  onMaterialsConfirmed(materials: string[]): void {
    this.form.controls.materialNecesario.setValue(materials);
  }

  onEquipmentConfirmed(items: Array<{ equipmentId: number; name: string; quantity: number }>): void {
    // Source of truth for v2 material.
    this.form.controls.materialEquipo.setValue(items ?? []);

    // Keep legacy string list in sync (best-effort) so existing UI continues to show something.
    const names = (items ?? [])
      .map((x) => (x?.name ?? '').toString().trim())
      .filter((x) => x.length > 0);
    this.form.controls.materialNecesario.setValue(Array.from(new Set(names)));
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
