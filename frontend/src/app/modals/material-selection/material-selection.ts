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

  // New shape (option B): material + quantities.
  // If provided, it takes precedence over selectedMaterials.
  @Input() availableEquipment: Array<{ id: number; name: string }> = [];
  @Input() selectedEquipment: Array<{ equipmentId: number; name: string; quantity: number }> = [];

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string[]>();

  @Output() confirmEquipment = new EventEmitter<Array<{ equipmentId: number; name: string; quantity: number }>>();

  query = '';
  private workingSelection = new Set<string>();
  private workingEquipment = new Map<number, { equipmentId: number; name: string; quantity: number }>();

  ngOnChanges(): void {
    // Sync internal selection whenever inputs change.
    this.workingSelection = new Set(this.selectedMaterials);

    // Sync equipment selection when in equipment mode.
    this.workingEquipment = new Map(
      (this.selectedEquipment ?? [])
        .filter((row) => row && Number.isFinite(row.equipmentId))
        .map((row) => [Number(row.equipmentId), { ...row, equipmentId: Number(row.equipmentId), quantity: Number(row.quantity) || 1 }]),
    );
  }

  get isEquipmentMode(): boolean {
    return Array.isArray(this.availableEquipment) && this.availableEquipment.length > 0;
  }

  get filteredMaterials(): string[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.availableMaterials;
    return this.availableMaterials.filter((m) => m.toLowerCase().includes(q));
  }

  get filteredEquipment(): Array<{ id: number; name: string } & { selected: boolean; quantity: number }>{
    const q = this.query.trim().toLowerCase();
    const base = (this.availableEquipment ?? []).filter((e) => {
      if (!q) return true;
      return (e.name ?? '').toLowerCase().includes(q);
    });

    return base.map((e) => {
      const current = this.workingEquipment.get(Number(e.id));
      return {
        id: Number(e.id),
        name: String(e.name),
        selected: !!current,
        quantity: current?.quantity ?? 1,
      };
    });
  }

  isSelected(material: string): boolean {
    return this.workingSelection.has(material);
  }

  toggleMaterial(material: string): void {
    if (this.workingSelection.has(material)) this.workingSelection.delete(material);
    else this.workingSelection.add(material);
  }

  get selectedCount(): number {
    return this.isEquipmentMode ? this.workingEquipment.size : this.workingSelection.size;
  }

  toggleEquipment(equipmentId: number, name: string): void {
    const id = Number(equipmentId);
    if (this.workingEquipment.has(id)) this.workingEquipment.delete(id);
    else this.workingEquipment.set(id, { equipmentId: id, name: String(name), quantity: 1 });
  }

  setEquipmentQuantity(equipmentId: number, qty: number): void {
    const id = Number(equipmentId);
    const current = this.workingEquipment.get(id);
    if (!current) return;
    const nextQty = Math.max(1, Math.floor(Number(qty) || 1));
    this.workingEquipment.set(id, { ...current, quantity: nextQty });
  }

  incEquipment(equipmentId: number): void {
    const row = this.workingEquipment.get(Number(equipmentId));
    if (!row) return;
    this.workingEquipment.set(Number(equipmentId), { ...row, quantity: (row.quantity ?? 1) + 1 });
  }

  decEquipment(equipmentId: number): void {
    const row = this.workingEquipment.get(Number(equipmentId));
    if (!row) return;
    this.workingEquipment.set(Number(equipmentId), { ...row, quantity: Math.max(1, (row.quantity ?? 1) - 1) });
  }

  onHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancel.emit();
  }

  onConfirm(): void {
    this.visible = false;
    this.visibleChange.emit(false);

    if (this.isEquipmentMode) {
      const result = Array.from(this.workingEquipment.values());
      this.confirmEquipment.emit(result);
      return;
    }

    const result = Array.from(this.workingSelection);
    this.confirm.emit(result);
  }
}
