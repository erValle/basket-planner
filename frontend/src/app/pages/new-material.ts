import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';

import { PageHeader } from '../components/page-header/page-header';
import { AppShell } from '../layout/app-shell/app-shell';

@Component({
  selector: 'app-new-material',
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, InputTextModule, SelectModule, InputNumberModule, PageHeader, AppShell],
  templateUrl: './new-material.html',
  styleUrl: './new-material.css',
})
export class NewMaterial {
  constructor(private readonly router: Router) {}

  teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam = this.teamsTop[0];

  categoryOptions = [
    { label: 'Balones', value: 'Balones' },
    { label: 'Conos', value: 'Conos' },
    { label: 'Petos', value: 'Petos' },
    { label: 'Otros', value: 'Otros' },
  ];

  form = {
    name: '',
    category: 'Balones',
    total: 0,
    available: 0,
  };

  cancel(): void {
    this.router.navigateByUrl('/material');
  }

  save(): void {
    // UI stub: for now simply return to the list.
    this.router.navigateByUrl('/material');
  }
}
