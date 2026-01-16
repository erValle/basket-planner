import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';

export interface PlanningExercise {
  id: string;
  name: string;
  series: number;
  reps: number;
  durationMin: number;
  intensity: string;
  restSec: number;
  material: string[];
  notes: string;
  difficulty?: {
    tactica?: number;
    tecnica?: number;
    fisica?: number;
    mental?: number;
  };
}

type Option = { label: string; value: string };

@Component({
  selector: 'app-planning-exercise-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    ChipModule,
    TooltipModule,
  ],
  templateUrl: './planning-exercise-card.html',
})
export class PlanningExerciseCard {
  @Input({ required: true }) exercise!: PlanningExercise;
  @Input() exerciseIndex = 0;
  @Input() isFirst = false;
  @Input() isLast = false;
  @Input() materialOptions: Option[] = [];
  @Input() intensityOptions: Option[] = [
    { label: 'Baja', value: 'Baja' },
    { label: 'Media', value: 'Media' },
    { label: 'Alta', value: 'Alta' },
  ];

  @Output() remove = new EventEmitter<string>();
  @Output() moveUp = new EventEmitter<string>();
  @Output() moveDown = new EventEmitter<string>();
  @Output() preview = new EventEmitter<PlanningExercise>();
  @Output() change = new EventEmitter<PlanningExercise>();

  selectedMaterial = signal<string | null>(null);

  // Inline validation
  touched = new Set<string>();

  markTouched(key: string): void {
    this.touched.add(key);
  }

  hasError(key: string, valid: boolean): boolean {
    return this.touched.has(key) && !valid;
  }

  onRemove(): void {
    this.remove.emit(this.exercise.id);
  }

  onMoveUp(): void {
    this.moveUp.emit(this.exercise.id);
  }

  onMoveDown(): void {
    this.moveDown.emit(this.exercise.id);
  }

  onPreview(): void {
    this.preview.emit(this.exercise);
  }

  addMaterial(): void {
    const m = this.selectedMaterial()?.trim();
    if (!m) return;
    if (!this.exercise.material.includes(m)) {
      this.exercise.material = [...this.exercise.material, m];
      this.emitChange();
    }
    this.selectedMaterial.set(null);
  }

  removeMaterial(material: string): void {
    this.exercise.material = this.exercise.material.filter((m) => m !== material);
    this.emitChange();
  }

  clearMaterial(): void {
    this.exercise.material = [];
    this.emitChange();
  }

  emitChange(): void {
    this.change.emit(this.exercise);
  }

  // Formatea la dificultad 4D para mostrarla
  formatDifficulty4D(): string {
    const d = this.exercise.difficulty;
    if (!d) return 'N/A';
    
    const parts: string[] = [];
    if (d.tactica != null) parts.push(`Tác: ${d.tactica}`);
    if (d.tecnica != null) parts.push(`Téc: ${d.tecnica}`);
    if (d.fisica != null) parts.push(`Fís: ${d.fisica}`);
    if (d.mental != null) parts.push(`Men: ${d.mental}`);
    
    return parts.length > 0 ? parts.join(' | ') : 'N/A';
  }

  // Calcula la media de las 4 dimensiones
  getAverageDifficulty(): number {
    const d = this.exercise.difficulty;
    if (!d) return 0;
    
    const values = [d.tactica, d.tecnica, d.fisica, d.mental]
      .filter((v): v is number => typeof v === 'number');
    
    if (values.length === 0) return 0;
    return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  }
}
