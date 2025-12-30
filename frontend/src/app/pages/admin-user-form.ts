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

import { UsersApiService } from '../services/users.api';
import { AdminUserRole, AdminUserStatus, AdminUserUpsertPayload } from '../models/user-admin';
import { Observable } from 'rxjs';

type Option = { label: string; value: string };

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
    PageHeader,
    AppShell,
  ],
  templateUrl: './admin-user-form.html',
  styleUrl: './admin-user-form.css',
  providers: [MessageService],
})
export class AdminUserForm {
  teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam = this.teamsTop[0];

  userId: string | null = null;
  isEdit = false;

  loading = false;
  loadError: string | null = null;
  saving = false;

  roleOptions: Option[] = [
    { label: 'Admin', value: 'admin' },
    { label: 'Entrenador', value: 'coach' },
    { label: 'Staff', value: 'staff' },
    { label: 'Jugador', value: 'player' },
  ];

  statusOptions: Option[] = [
    { label: 'Activo', value: 'active' },
    { label: 'Bloqueado', value: 'blocked' },
    { label: 'Pendiente', value: 'pending' },
  ];

  form: AdminUserUpsertPayload = {
    name: '',
    email: '',
    role: 'coach',
    status: 'active',
  };

  touched = new Set<string>();

  constructor(
    private readonly api: UsersApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toast: MessageService,
  ) {}

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
    return this.nameValid && this.emailValid && !!this.form.role && !!this.form.status;
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
            role: u.role as AdminUserRole,
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

  save(): void {
    if (!this.canSave || this.saving) {
      this.toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'Hay campos obligatorios inválidos.' });
      return;
    }

    this.saving = true;

    const req$: Observable<unknown> =
      this.isEdit && this.userId ? this.api.update(this.userId, this.form) : this.api.create(this.form);

    req$.subscribe({
      next: (res) => {
        this.saving = false;
        this.toast.add({ severity: 'success', summary: 'Guardado', detail: 'Usuario guardado (stub).' });

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
