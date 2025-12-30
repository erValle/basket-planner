import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';

@Component({
  selector: 'app-new-user',
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, InputTextModule, SelectModule, AppShell, PageHeader],
  templateUrl: './new-user.html',
  styleUrl: './new-user.css',
})
export class NewUser {
  constructor(private readonly router: Router) {}

  teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam = this.teamsTop[0];

  roleOptions = [
    { label: 'Entrenador', value: 'coach' },
    { label: 'Jugador', value: 'player' },
    { label: 'Staff', value: 'staff' },
    { label: 'Admin', value: 'admin' },
  ];

  form = {
    firstName: '',
    lastName: '',
    email: '',
    role: 'coach',
  };

  cancel(): void {
    this.router.navigateByUrl('/dashboard');
  }

  save(): void {
    // UI stub: later wire to backend.
    this.router.navigateByUrl('/dashboard');
  }
}
