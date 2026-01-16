import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';

import { UsersApiService } from '../services/users.api';
import { AdminUserUpsertPayload } from '../models/user-admin';

@Component({
  selector: 'app-new-user',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ProgressSpinnerModule,
    AppShell,
    PageHeader,
  ],
  templateUrl: './new-user.html',
  styleUrl: './new-user.scss',
  providers: [MessageService],
})
export class NewUser {
  constructor(
    private readonly router: Router,
    private readonly usersApi: UsersApiService,
    private readonly toast: MessageService,
  ) {}

  private generatePassword(length = 12): string {
    // Simple, client-generated initial password (shown once after create).
    // Matches backend validation: min 6 chars.
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?';
    let out = '';
    for (let i = 0; i < length; i++) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
  }

  roleOptions = [
    { label: 'Sin rol', value: '' },
    { label: 'Admin', value: 'admin' },
    { label: 'Director Técnico', value: 'technical_director' },
    { label: 'Entrenador', value: 'coach' },
    { label: 'Jugador', value: 'player' },
    { label: 'Usuario', value: 'user' },
  ];

  form = {
    firstName: '',
    lastName: '',
    email: '',
    role: '' as string,
  };

  generatedPassword = this.generatePassword();
  createdUserId: string | null = null;

  saving = false;

  private isEmail(v: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  get canSave(): boolean {
    return (
      !this.saving &&
      !this.createdUserId &&
      this.form.firstName.trim().length >= 2 &&
      this.form.lastName.trim().length >= 2 &&
      this.isEmail(this.form.email)
    );
  }

  regeneratePassword(): void {
    if (this.saving || this.createdUserId) return;
    this.generatedPassword = this.generatePassword();
  }

  copyPassword(): void {
    if (!this.generatedPassword) return;
    // Best-effort: clipboard API might be unavailable depending on context.
    navigator.clipboard
      ?.writeText(this.generatedPassword)
      .then(() => this.toast.add({ severity: 'success', summary: 'Copiado', detail: 'Contraseña copiada al portapapeles.' }))
      .catch(() => this.toast.add({ severity: 'warn', summary: 'No se pudo copiar', detail: 'Copia manualmente la contraseña.' }));
  }

  cancel(): void {
    this.router.navigateByUrl('/admin/users');
  }

  save(): void {
    if (!this.canSave) {
      this.toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'Completa nombre, apellidos y un email válido.' });
      return;
    }

    if (this.saving) return;
    this.saving = true;

    const payload: AdminUserUpsertPayload = {
      name: `${this.form.firstName.trim()} ${this.form.lastName.trim()}`.trim(),
      email: this.form.email.trim(),
      // Backend requires password on create
      password: this.generatedPassword,
      role: this.form.role ? (this.form.role as any) : null,
      status: 'active' as any,
    };

    this.usersApi.create(payload).subscribe({
      next: (res) => {
        this.saving = false;
        const id = res?.id;
        this.createdUserId = id ?? null;

        this.toast.add({
          severity: 'success',
          summary: 'Usuario creado',
          detail: 'Copia la contraseña generada antes de salir de esta pantalla.',
        });
      },
      error: (e: unknown) => {
        this.saving = false;
        const msg = e instanceof Error ? e.message : 'No se pudo crear el usuario.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
