import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';

import { PlayerDetail, PlayerDetailModel } from '../modals/player-detail/player-detail';
import { PlayerSelection, PlayerSelectionItem } from '../modals/player-selection/player-selection';

type PlayerStatus = 'active' | 'revision';

interface Player {
  id: string;
  name: string;
  team: string;
  category: string;
  position: string;
  status: PlayerStatus;
  firstName: string;
  lastName: string;
  birthDate: string;
  dni: string;
  height: number;
  weight: number;
  dominantHand: string;
  club: string;
  currentTeam: string;
  weeklyLoad: string;
  lastFeedback: string;
  notes: string;
}

type Option = { label: string; value: string };

@Component({
  selector: 'app-players',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    DialogModule,
    TagModule,
    PlayerDetail,
    PlayerSelection,
  ],
  templateUrl: './players.html',
  styleUrl: './players.css',
})
export class Players {
  teams: string[] = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam: string = this.teams[0];

  selectedPlayer: PlayerDetailModel | null = null;
  playerDetailVisible = false;

  playerSelectionVisible = false;
  selectedPlayerIds: string[] = [];

  // Sample pool mirroring the mockup
  availablePlayersForSelection: PlayerSelectionItem[] = [
    { id: '1', nombre: 'Juan Pérez', posicion: 'Base', categoria: 'Senior' },
    { id: '2', nombre: 'Carlos López', posicion: 'Alero', categoria: 'Senior' },
    { id: '3', nombre: 'Miguel Ángel Ruiz', posicion: 'Escolta', categoria: 'Senior' },
    { id: '4', nombre: 'David Martín', posicion: 'Pívot', categoria: 'Senior' },
    { id: '5', nombre: 'Alberto Sánchez', posicion: 'Ala-Pívot', categoria: 'Senior' },
    { id: '6', nombre: 'Javier González', posicion: 'Base', categoria: 'Junior' },
    { id: '7', nombre: 'Pablo Fernández', posicion: 'Alero', categoria: 'Junior' },
    { id: '8', nombre: 'Sergio Rodríguez', posicion: 'Escolta', categoria: 'Junior' },
  ];

  clubOptions: Option[] = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Club Ficticio', value: 'Club Ficticio' },
  ];

  teamOptions: Option[] = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Senior Masculino', value: 'Senior Masculino' },
    { label: 'U18 A', value: 'U18 A' },
  ];

  categoryOptions: Option[] = [
    { label: 'Todas', value: 'Todas' },
    { label: 'Senior', value: 'Senior' },
    { label: 'U18', value: 'U18' },
  ];

  filters = {
    club: 'Todos',
    team: 'Todos',
    category: 'Todas',
    search: '',
  };

  players: PlayerDetailModel[] = [
    {
      id: '1',
      name: 'Juan Pérez',
      team: 'Senior Masculino',
      category: 'Senior',
      position: 'Base',
      status: 'active',
      firstName: 'Juan',
      lastName: 'Pérez García',
      birthDate: '12/04/2002',
      dni: '',
      height: 185,
      weight: 78,
      dominantHand: 'Derecha',
      club: 'Club Ficticio Valladolid',
      currentTeam: 'Senior Masculino - 2025/26',
      weeklyLoad: '3 sesiones · 240 minutos.',
      lastFeedback: '"Buena combinación de tiro y físico." · 4/5',
      notes: '',
    },
    {
      id: '2',
      name: 'Carlos López',
      team: 'U18 A',
      category: 'U18',
      position: 'Alero',
      status: 'revision',
      firstName: 'Carlos',
      lastName: 'López Martín',
      birthDate: '15/08/2006',
      dni: '',
      height: 192,
      weight: 82,
      dominantHand: 'Derecha',
      club: 'Club Ficticio Valladolid',
      currentTeam: 'U18 A - 2025/26',
      weeklyLoad: '4 sesiones · 320 minutos.',
      lastFeedback: '"Mejorar defensa individual." · 3/5',
      notes: '',
    },
  ];

  get filteredPlayers(): PlayerDetailModel[] {
    return this.players.filter((player) => {
      const matchesClub = this.filters.club === 'Todos' || player.club.includes(this.filters.club);
      const matchesTeam = this.filters.team === 'Todos' || player.team === this.filters.team;
      const matchesCategory = this.filters.category === 'Todas' || player.category === this.filters.category;
      const matchesSearch =
        this.filters.search === '' || player.name.toLowerCase().includes(this.filters.search.toLowerCase());

      return matchesClub && matchesTeam && matchesCategory && matchesSearch;
    });
  }

  clearFilters() {
    this.filters = { club: 'Todos', team: 'Todos', category: 'Todas', search: '' };
  }

  openPlayer(player: PlayerDetailModel) {
    this.selectedPlayer = structuredClone(player);
    this.playerDetailVisible = true;
  }

  closePlayer() {
    this.playerDetailVisible = false;
    this.selectedPlayer = null;
  }

  openPlayerSelection() {
    this.playerSelectionVisible = true;
  }

  closePlayerSelection() {
    this.playerSelectionVisible = false;
  }

  confirmPlayerSelection(ids: string[]) {
    this.selectedPlayerIds = ids;
    this.closePlayerSelection();
  }

  savePlayer(updated?: PlayerDetailModel) {
    // In this mock stage we just accept the edited object.
    if (updated) {
      this.selectedPlayer = updated;
    }

    // TODO: wire to API + update table row
    this.closePlayer();
  }
}
