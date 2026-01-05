import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

export interface PlayerSelectionItem {
  id: string;
  nombre: string;
  posicion: string;
  categoria: string;
}

@Component({
  selector: 'app-player-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TagModule],
  templateUrl: './player-selection.html',
  styleUrl: './player-selection.css',
})
export class PlayerSelection {
  @Input() title = 'Seleccionar jugadores';
  @Input() subtitle = 'Añade jugadores al equipo';

  /** IDs selected when opening the modal */
  @Input() selectedPlayers: string[] = [];

  /** List of players available to select */
  @Input() availablePlayers: PlayerSelectionItem[] = [
    { id: '1', nombre: 'Juan Pérez', posicion: 'Base', categoria: 'Senior' },
    { id: '2', nombre: 'Carlos López', posicion: 'Alero', categoria: 'Senior' },
    { id: '3', nombre: 'Miguel Ángel Ruiz', posicion: 'Escolta', categoria: 'Senior' },
    { id: '4', nombre: 'David Martín', posicion: 'Pívot', categoria: 'Senior' },
    { id: '5', nombre: 'Alberto Sánchez', posicion: 'Ala-Pívot', categoria: 'Senior' },
    { id: '6', nombre: 'Javier González', posicion: 'Base', categoria: 'Junior' },
    { id: '7', nombre: 'Pablo Fernández', posicion: 'Alero', categoria: 'Junior' },
    { id: '8', nombre: 'Sergio Rodríguez', posicion: 'Escolta', categoria: 'Junior' },
  ];

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string[]>();

  searchTerm = '';
  selected: string[] = [];

  ngOnInit() {
    // Copy input to internal state
    this.selected = [...this.selectedPlayers];
  }

  get filteredPlayers(): PlayerSelectionItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.availablePlayers;

    return this.availablePlayers.filter(
      (p) => p.nombre.toLowerCase().includes(term) || p.posicion.toLowerCase().includes(term)
    );
  }

  isSelected(id: string) {
    return this.selected.includes(id);
  }

  togglePlayer(playerId: string) {
    this.selected = this.selected.includes(playerId)
      ? this.selected.filter((id) => id !== playerId)
      : [...this.selected, playerId];
  }

  onCancel() {
    this.cancel.emit();
  }

  onConfirm() {
    this.confirm.emit(this.selected);
  }
}
