import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import { AppShell } from '../layout/app-shell/app-shell';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, FormsModule, ButtonModule, SelectModule, AppShell],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam = this.teamsTop[0];

  planningModeOptions: Array<{ label: string; value: 'individual' | 'group' }> = [
    { label: 'Individual', value: 'individual' },
    { label: 'Grupal', value: 'group' },
  ];

  selectedPlanningMode: 'individual' | 'group' = 'individual';
}
