import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';

@Component({
  selector: 'app-new-club',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, AppShell, PageHeader],
  templateUrl: './new-club.html',
  styleUrl: './new-club.css',
})
export class NewClub {
  teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam: string | null = this.teamsTop[0];

  form = {
    name: '',
    city: '',
    shortName: ''
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
