import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';
import { BpDialog } from '../components/bp-dialog';

import { UsersApiService } from '../services/users.api';
import { AdminUserRole, AdminUserStatus, AdminUserUpsertPayload } from '../models/user-admin';
import { Observable } from 'rxjs';

type Option = { label: string; value: string | null };

@Component({
  selector: 'app-admin-user-form',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ProgressSpinnerModule,
    BpDialog,
    PageHeader,
    AppShell,
  ],
  templateUrl: './admin-user-form.html',
  styleUrl: './admin-user-form.scss',
  providers: [MessageService],
})
export class AdminUserForm {
  userId: string | null = null;
  isEdit = false;

  loading = false;
  loadError: string | null = null;
  saving = false;

  roleOptions: Option[] = [
    { label: 'Sin rol', value: null },
    { label: 'Admin', value: 'admin' },
    { label: 'Director Técnico', value: 'technical_director' },
    { label: 'Entrenador', value: 'coach' },
    { label: 'Jugador', value: 'player' },
    { label: 'Usuario', value: 'user' },
  ];

  statusOptions: Option[] = [
    { label: 'Activo', value: 'active' },
    { label: 'Bloqueado', value: 'blocked' },
    { label: 'Pendiente', value: 'pending' },
  ];

  form: AdminUserUpsertPayload = {
    name: '',
    email: '',
    role: null,
    status: 'active',
  };

  touched = new Set<string>();

  // Admin password reset (backend supports PUT /api/users/:id with password)
  passwordResetOpen = false;
  resettingPassword = false;
  newPassword = this.generatePassword();

  constructor(
    private readonly api: UsersApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toast: MessageService,
  ) {}

  private generatePassword(length = 12): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?';
    let out = '';
    for (let i = 0; i < length; i++) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.userId;
    if (this.isEdit) this.load();
  }

  markTouched(key: string): void {
    this.touched.add(key);
  }

  private isEmail(v: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  get nameValid(): boolean {
    return this.form.name.trim().length >= 2;
  }

  get emailValid(): boolean {
    return this.isEmail(this.form.email);
  }

  get canSave(): boolean {
    // Role is optional: admin can create user without role and later assign it.
    return this.nameValid && this.emailValid && !!this.form.status;
  }

  load(): void {
    if (!this.userId) return;
    this.loading = true;
    this.loadError = null;
    this.api.get(this.userId).subscribe({
      next: (u) => {
        this.loading = false;
        if (u?.id) {
          this.form = {
            name: u.name,
            email: u.email,
            role: (u.role as AdminUserRole | null) ?? null,
            status: u.status as AdminUserStatus,
          };
        }
      },
      error: (e: unknown) => {
        this.loading = false;
        const msg = e instanceof Error ? e.message : 'No se pudo cargar el usuario.';
        this.loadError = msg;
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/users']);
  }

  openPasswordReset(): void {
    if (!this.userId) return;
    this.newPassword = this.generatePassword();
    this.passwordResetOpen = true;
  }

  regeneratePassword(): void {
    if (this.resettingPassword) return;
    this.newPassword = this.generatePassword();
  }

  copyPassword(): void {
    if (!this.newPassword) return;
    navigator.clipboard
      ?.writeText(this.newPassword)
      .then(() => this.toast.add({ severity: 'success', summary: 'Copiado', detail: 'Contraseña copiada al portapapeles.' }))
      .catch(() => this.toast.add({ severity: 'warn', summary: 'No se pudo copiar', detail: 'Copia manualmente la contraseña.' }));
  }

  confirmPasswordReset(): void {
    if (!this.userId || this.resettingPassword) return;
    if ((this.newPassword ?? '').trim().length < 6) {
      this.toast.add({ severity: 'warn', summary: 'Contraseña inválida', detail: 'Debe tener al menos 6 caracteres.' });
      return;
    }

    this.resettingPassword = true;
    this.api.setPassword(this.userId, this.newPassword).subscribe({
      next: () => {
        this.resettingPassword = false;
        this.passwordResetOpen = false;
        this.toast.add({
          severity: 'success',
          summary: 'Contraseña actualizada',
          detail: 'Copia esta contraseña y compártela con el usuario de forma segura.',
        });
      },
      error: (e: unknown) => {
        this.resettingPassword = false;
        const msg = e instanceof Error ? e.message : 'No se pudo actualizar la contraseña.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  save(): void {
    if (!this.canSave || this.saving) {
      this.toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'Hay campos obligatorios inválidos.' });
      return;
    }

    this.saving = true;

    const payload: AdminUserUpsertPayload = {
      ...this.form,
      role: this.form.role ? this.form.role : null,
    };

    const req$: Observable<unknown> =
      this.isEdit && this.userId ? this.api.update(this.userId, payload) : this.api.create(payload);

    req$.subscribe({
      next: (res) => {
        this.saving = false;
        this.toast.add({ severity: 'success', summary: 'Guardado', detail: 'Usuario guardado.' });

        const id = this.userId ?? (res as { id?: string } | null | undefined)?.id;
        this.router.navigate(['/admin/users', id ?? '']);
      },
      error: (e: unknown) => {
        this.saving = false;
        const msg = e instanceof Error ? e.message : 'No se pudo guardar el usuario.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
