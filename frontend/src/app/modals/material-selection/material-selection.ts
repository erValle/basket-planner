import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-material-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule],
  templateUrl: './material-selection.html',
  styleUrl: './material-selection.css',
})
export class MaterialSelection {

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() title = 'Seleccionar material deportivo';
  @Input() subtitle = 'Elige el material necesario para el ejercicio';

  @Input() availableMaterials: string[] = [
    'Balones',
    'Conos',
    'Petos',
    'Aros',
    'Pesas',
    'Gomas elásticas',
    'Escalera de agilidad',
    'Vallas',
    'Bandas elásticas',
    'Mancuernas',
    'Cuerdas',
    'Esterillas',
  ];

  /** Incoming selection (source of truth) */
  @Input() selectedMaterials: string[] = [];

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string[]>();

  query = '';
  private workingSelection = new Set<string>();

  ngOnChanges(): void {
    // Sync internal selection whenever inputs change.
    this.workingSelection = new Set(this.selectedMaterials);
  }

  get filteredMaterials(): string[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.availableMaterials;
    return this.availableMaterials.filter((m) => m.toLowerCase().includes(q));
  }

  isSelected(material: string): boolean {
    return this.workingSelection.has(material);
  }

  toggleMaterial(material: string): void {
    if (this.workingSelection.has(material)) this.workingSelection.delete(material);
    else this.workingSelection.add(material);
  }

  get selectedCount(): number {
    return this.workingSelection.size;
  }

  onHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancel.emit();
  }

  onConfirm(): void {
    const result = Array.from(this.workingSelection);
    this.visible = false;
    this.visibleChange.emit(false);
    this.confirm.emit(result);
  }
}
