import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { PageHeader } from '../components/page-header/page-header';
import { AppShell } from '../layout/app-shell/app-shell';

@Component({
  selector: 'app-player-dashboard',
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, TagModule, PageHeader, AppShell],
  templateUrl: './player-dashboard.html',
  styleUrl: './player-dashboard.css',
})
export class PlayerDashboard {
	teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
	selectedTeam = this.teamsTop[0];

  player = {
    id: 'p8',
    name: 'Jugador #8',
    position: 'Escolta',
    status: 'activo' as const,
  };

  metrics = [
    { id: 'm1', label: 'Carga semanal', value: 78, hint: 'Objetivo 60–75', severity: 'warn' as const },
    { id: 'm2', label: 'Sueño', value: 6.2, hint: 'Horas promedio', severity: 'info' as const },
    { id: 'm3', label: 'Dolor', value: 2, hint: '0–10', severity: 'success' as const },
  ];

  feedback = [
    { id: 'f1', title: 'Piernas cargadas', when: 'Hoy', note: 'Reducir impactos; más movilidad.', severity: 'warn' as const },
    { id: 'f2', title: 'Buen ánimo', when: 'Ayer', note: 'Alta motivación; mantener intensidad.', severity: 'success' as const },
  ];
}
