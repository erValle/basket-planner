import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';

import { PageHeader } from '../components/page-header/page-header';
import { AppShell } from '../layout/app-shell/app-shell';

@Component({
  selector: 'app-session-detail',
  imports: [CommonModule, FormsModule, RouterModule, RouterLink, ButtonModule, DialogModule, TextareaModule, TagModule, PageHeader, AppShell],
  templateUrl: './session-detail.html',
  styleUrl: './session-detail.css',
})
export class SessionDetail {
  teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam = this.teamsTop[0];

  session = {
    id: 's1',
    title: 'Sesión · Senior Masculino',
    date: '2025-12-28',
    durationMin: 90,
    status: 'completada' as const,
    objective: 'Mejorar transiciones ofensivas y rebote defensivo.',
  };

  blocks = [
    {
      id: 'b1',
      name: 'Calentamiento',
      durationMin: 15,
      focus: 'Movilidad + activación',
      notes: 'RPE objetivo 4/10',
    },
    {
      id: 'b2',
      name: 'Parte principal',
      durationMin: 60,
      focus: 'Transición 3v2 + 4v3, rebote y 5v5',
      notes: 'Controlar carga y pausas',
    },
    {
      id: 'b3',
      name: 'Vuelta a la calma',
      durationMin: 15,
      focus: 'Estiramientos + respiración',
      notes: 'Recuperación activa',
    },
  ];

  feedbackDialogVisible = false;
  draftFeedback = {
    coachNotes: '',
    nextSessionAdjustments: '',
  };

  openFeedback(): void {
    this.feedbackDialogVisible = true;
  }

	closeFeedback(): void {
		this.feedbackDialogVisible = false;
	}

  saveFeedback(): void {
    // Stub: later wire to backend.
    this.feedbackDialogVisible = false;
  }
}
