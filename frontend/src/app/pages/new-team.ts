import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';

@Component({
  selector: 'app-new-team',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, InputNumberModule, AppShell, PageHeader],
  templateUrl: './new-team.html',
  styleUrl: './new-team.css',
})
export class NewTeam {
  teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam: string | null = this.teamsTop[0];

  form = {
    name: '',
    season: '2025/26',
    playersCount: 0
  };

  constructor(private readonly router: Router) {}

  cancel() {
    this.router.navigateByUrl('/dashboard');
  }

  save() {
    // TODO: connect to backend endpoint
    this.router.navigateByUrl('/dashboard');
  }

}
