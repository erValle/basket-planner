import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';

import { EquipmentApi, EquipmentDto } from '../../services/equipment.api';
import { ExercisesApi } from '../../services/exercises.api';
import { ErrorCard } from '../error-card/error-card';

export interface ExerciseFormValue {
  nombre: string;
  descripcion: string;
  tipo: string;
  estado: 'Activo' | 'Inactivo';
  dificultadTactica: number;
  dificultadTecnica: number;
  dificultadFisica: number;
  dificultadMental: number;
  duracionMinutos: number;
  etiquetas: string[];
  materialesNecesarios: string[];
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
    ChipModule,
    ErrorCard,
  ],
  templateUrl: './exercise-form.html',
  styleUrl: './exercise-form.scss',
})
export class ExerciseForm implements OnChanges, OnInit {
  private fb = inject(FormBuilder);
  private equipmentApi = inject(EquipmentApi);
  private exercisesApi = inject(ExercisesApi);

  @Input() initialValue: ExerciseDraft | null = null;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<ExerciseFormValue>();
  @Output() delete = new EventEmitter<void>();

  Math = Math;

  get isViewMode(): boolean {
    return this.mode === 'view';
  }

  // Estado
  equipmentLoading = false;
  equipmentItems: EquipmentDto[] = [];
  popularTags: Array<{ tag: string; count: number }> = [];
  popularTagsLoading = false;
  showAllTags = false;
  showAllMaterials = false;
  formError: string | null = null;

  readonly INITIAL_ITEMS_TO_SHOW = 10;
  readonly difficultyLevels = [1, 2, 3, 4, 5];

  // Tipos específicos de baloncesto
  readonly tipoOptions: Option[] = [
    { label: 'Selecciona un tipo', value: '' },
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

  form = this.fb.nonNullable.group({
    nombre: this.fb.nonNullable.control('', [Validators.required]),
    descripcion: this.fb.nonNullable.control(''),
    tipo: this.fb.nonNullable.control('', [Validators.required]),
    estado: this.fb.nonNullable.control<'Activo' | 'Inactivo'>('Activo'),
    duracionMinutos: this.fb.nonNullable.control(5, [Validators.required, Validators.min(1), Validators.max(60)]),
    dificultadTactica: this.fb.nonNullable.control(3, [Validators.required, Validators.min(1), Validators.max(5)]),
    dificultadTecnica: this.fb.nonNullable.control(3, [Validators.required, Validators.min(1), Validators.max(5)]),
    dificultadFisica: this.fb.nonNullable.control(3, [Validators.required, Validators.min(1), Validators.max(5)]),
    dificultadMental: this.fb.nonNullable.control(3, [Validators.required, Validators.min(1), Validators.max(5)]),
    etiquetas: this.fb.nonNullable.control<string[]>([]),
    materialesNecesarios: this.fb.nonNullable.control<string[]>([]),
  });

  ngOnInit(): void {
    this.loadEquipment();
    this.loadPopularTags();
    // Si es modo create sin initialValue, asegurar que el form está reseteado
    if (this.mode === 'create' && !this.initialValue) {
      this.resetFormToDefaults();
    }
    
    // Asegurar estado del formulario después de la inicialización
    this.updateFormEnabledState();
  }

  ngOnChanges(): void {
    // Reset error state
    this.formError = null;
    
    if (this.initialValue) {
      // Edit or View mode with existing data
      this.form.patchValue({
        nombre: this.initialValue.nombre ?? '',
        descripcion: this.initialValue.descripcion ?? '',
        tipo: this.initialValue.tipo ?? '',
        estado: (this.initialValue.estado as 'Activo' | 'Inactivo') ?? 'Activo',
        duracionMinutos: this.initialValue.duracionMinutos ?? 5,
        dificultadTactica: this.initialValue.dificultadTactica ?? 3,
        dificultadTecnica: this.initialValue.dificultadTecnica ?? 3,
        dificultadFisica: this.initialValue.dificultadFisica ?? 3,
        dificultadMental: this.initialValue.dificultadMental ?? 3,
        etiquetas: this.initialValue.etiquetas ?? [],
        materialesNecesarios: this.initialValue.materialesNecesarios ?? [],
      });
    } else {
      // Create mode - reset form to defaults
      this.resetFormToDefaults();
    }

    // Enable/disable based on mode
    this.updateFormEnabledState();
  }
  
  private updateFormEnabledState(): void {
    if (this.mode === 'view') {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
    }
  }

  private resetFormToDefaults(): void {
    this.form.controls.nombre.setValue('');
    this.form.controls.descripcion.setValue('');
    this.form.controls.tipo.setValue('');
    this.form.controls.estado.setValue('Activo');
    this.form.controls.duracionMinutos.setValue(5);
    this.form.controls.dificultadTactica.setValue(3);
    this.form.controls.dificultadTecnica.setValue(3);
    this.form.controls.dificultadFisica.setValue(3);
    this.form.controls.dificultadMental.setValue(3);
    this.form.controls.etiquetas.setValue([]);
    this.form.controls.materialesNecesarios.setValue([]);
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private loadEquipment(): void {
    this.equipmentLoading = true;
    // Solo cargar material con status 'available'
    this.equipmentApi.list({ limit: 200 } as any).subscribe({
      next: (items) => {
        this.equipmentLoading = false;
        // Filtrar solo material disponible
        this.equipmentItems = (items ?? []).filter(item => item.status === 'available');
      },
      error: () => {
        this.equipmentLoading = false;
        this.equipmentItems = [];
      },
    });
  }

  private loadPopularTags(): void {
    this.popularTagsLoading = true;
    this.exercisesApi.getPopularTags().subscribe({
      next: (tags: Array<{ tag: string; count: number }>) => {
        this.popularTags = tags ?? [];
        this.popularTagsLoading = false;
      },
      error: () => {
        this.popularTags = [];
        this.popularTagsLoading = false;
      },
    });
  }

  get visibleTags(): Array<{ tag: string; count: number }> {
    if (this.showAllTags) return this.popularTags;
    return this.popularTags.slice(0, this.INITIAL_ITEMS_TO_SHOW);
  }

  get visibleMaterials(): EquipmentDto[] {
    if (this.showAllMaterials) return this.equipmentItems;
    return this.equipmentItems.slice(0, this.INITIAL_ITEMS_TO_SHOW);
  }

  setDifficulty(field: 'dificultadTactica' | 'dificultadTecnica' | 'dificultadFisica' | 'dificultadMental', value: number): void {
    if (this.isViewMode) return;
    this.form.controls[field].setValue(value);
  }

  isTagSelected(tag: string): boolean {
    return this.form.controls.etiquetas.value.includes(tag);
  }

  toggleTag(tag: string): void {
    if (this.isViewMode) return;
    const current = this.form.controls.etiquetas.value;
    if (current.includes(tag)) {
      this.form.controls.etiquetas.setValue(current.filter((t: string) => t !== tag));
    } else {
      this.form.controls.etiquetas.setValue([...current, tag]);
    }
  }

  removeTag(tag: string): void {
    if (this.isViewMode) return;
    const current = this.form.controls.etiquetas.value;
    this.form.controls.etiquetas.setValue(current.filter((t: string) => t !== tag));
  }

  isMaterialSelected(name: string): boolean {
    return this.form.controls.materialesNecesarios.value.includes(name);
  }

  toggleMaterial(name: string): void {
    if (this.isViewMode) return;
    const current = this.form.controls.materialesNecesarios.value;
    if (current.includes(name)) {
      this.form.controls.materialesNecesarios.setValue(current.filter((m: string) => m !== name));
    } else {
      this.form.controls.materialesNecesarios.setValue([...current, name]);
    }
  }

  removeMaterial(material: string): void {
    if (this.isViewMode) return;
    const current = this.form.controls.materialesNecesarios.value;
    this.form.controls.materialesNecesarios.setValue(current.filter((m: string) => m !== material));
  }

  getTipoLabel(value: string): string {
    const option = this.tipoOptions.find(opt => opt.value === value);
    return option?.label || value;
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }

  onSubmit(): void {
    console.log('[ExerciseForm] onSubmit called, mode:', this.mode);
    console.log('[ExerciseForm] form value:', this.form.getRawValue());
    console.log('[ExerciseForm] form valid:', this.form.valid);
    console.log('[ExerciseForm] form errors:', this.form.errors);
    
    // Log individual field errors
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control?.invalid) {
        console.log(`[ExerciseForm] Field "${key}" is invalid:`, control.errors);
      }
    });
    
    if (this.mode === 'view') {
      this.cancel.emit();
      return;
    }
    
    this.formError = null;
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      
      const errors: string[] = [];
      if (this.form.controls.nombre.invalid) errors.push('Nombre del ejercicio');
      if (this.form.controls.tipo.invalid) errors.push('Tipo de ejercicio');
      if (this.form.controls.duracionMinutos.invalid) errors.push('Duración');
      
      this.formError = `Por favor, completa los campos obligatorios: ${errors.join(', ')}.`;
      console.log('[ExerciseForm] Form invalid, showing error:', this.formError);
      return;
    }
    
    console.log('[ExerciseForm] Emitting save event');
    this.save.emit(this.form.getRawValue());
  }

  dismissError(): void {
    this.formError = null;
  }

  titleForSave(): string {
    if (this.mode === 'view') return 'Cerrar';
    return this.mode === 'edit' ? 'Guardar cambios' : 'Crear ejercicio';
  }
}
