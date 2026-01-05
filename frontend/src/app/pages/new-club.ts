import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';
import { ClubsApi } from '../services/clubs.api';

@Component({
  selector: 'app-new-club',
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule, AppShell, PageHeader],
  templateUrl: './new-club.html',
  styleUrl: './new-club.css',
  providers: [MessageService],
})
export class NewClub {
  form = {
    name: '',
    city: '',
    shortName: ''
  };

  saving = false;

  constructor(
    private readonly router: Router,
    private readonly clubsApi: ClubsApi,
    private readonly toast: MessageService,
  ) {}

  cancel() {
    this.router.navigateByUrl('/dashboard');
  }

  save() {
    if (this.saving) return;
    const name = this.form.name.trim();
    if (!name) {
      this.toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'El nombre es obligatorio.' });
      return;
    }

    this.saving = true;
    this.clubsApi.create({ name, city: this.form.city?.trim() || undefined }).subscribe({
      next: (created) => {
        this.saving = false;
        this.toast.add({ severity: 'success', summary: 'Club creado', detail: `#${created.id} · ${created.name}` });
        this.router.navigateByUrl('/clubs');
      },
      error: (e: unknown) => {
        this.saving = false;
        const msg = e instanceof Error ? e.message : 'No se pudo crear el club.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

}
