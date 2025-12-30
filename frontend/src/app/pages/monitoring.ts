import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

import { PageHeader } from '../components/page-header/page-header';
import { AppShell } from '../layout/app-shell/app-shell';

@Component({
  selector: 'app-monitoring',
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, DialogModule, InputTextModule, SelectModule, TagModule, PageHeader, AppShell],
  templateUrl: './monitoring.html',
  styleUrl: './monitoring.css',
})
export class Monitoring {
  teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam = this.teamsTop[0];

  severityOptions = [
    { label: 'Todas', value: 'all' },
    { label: 'Info', value: 'info' },
    { label: 'Aviso', value: 'warn' },
    { label: 'Crítico', value: 'danger' },
  ];

  filters = {
    search: '',
    severity: 'all',
  };

  kpis = {
    alerts24h: 3,
    highRiskPlayers: 1,
    recommendations: 7,
  };

  logs = [
    {
      id: 'l1',
      title: 'Riesgo de fatiga alto',
      message: 'El jugador #8 muestra carga elevada 3 días consecutivos.',
      severity: 'danger' as const,
      when: 'Hoy · 18:40',
    },
    {
      id: 'l2',
      title: 'Recomendación de descanso',
      message: 'Reducir intensidad en la sesión de mañana (grupo Senior).',
      severity: 'warn' as const,
      when: 'Hoy · 12:15',
    },
    {
      id: 'l3',
      title: 'Análisis completado',
      message: 'Se han actualizado métricas de la última sesión.',
      severity: 'info' as const,
      when: 'Ayer · 20:05',
    },
  ];

  selectedLog: (typeof this.logs)[number] | null = null;
  logDialogVisible = false;

  get filteredLogs() {
    const q = this.filters.search.trim().toLowerCase();
    return this.logs.filter((l) => {
      const matchesQuery = !q || l.title.toLowerCase().includes(q) || l.message.toLowerCase().includes(q);
      const matchesSeverity = this.filters.severity === 'all' || l.severity === this.filters.severity;
      return matchesQuery && matchesSeverity;
    });
  }

  clearFilters(): void {
    this.filters.search = '';
    this.filters.severity = 'all';
  }

  openDetail(item: (typeof this.logs)[number]): void {
    this.selectedLog = item;
    this.logDialogVisible = true;
  }

  closeDetail(): void {
    this.logDialogVisible = false;
    this.selectedLog = null;
  }
}
