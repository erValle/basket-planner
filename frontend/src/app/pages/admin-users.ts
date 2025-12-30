import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';

import { UsersApiService } from '../services/users.api';
import { AdminUserListItem, AdminUserRole, AdminUserStatus } from '../models/user-admin';

type Option<T extends string> = { label: string; value: T | 'all' };

@Component({
  selector: 'app-admin-users',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    PageHeader,
    AppShell,
  ],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
  providers: [MessageService, ConfirmationService],
})
export class AdminUsers {
  teamsTop = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam = this.teamsTop[0];

  roleOptions: Option<AdminUserRole>[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Admin', value: 'admin' },
    { label: 'Entrenador', value: 'coach' },
    { label: 'Staff', value: 'staff' },
    { label: 'Jugador', value: 'player' },
  ];

  statusOptions: Option<AdminUserStatus>[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Activo', value: 'active' },
    { label: 'Bloqueado', value: 'blocked' },
    { label: 'Pendiente', value: 'pending' },
  ];

  filters = {
    search: '',
    role: 'all' as AdminUserRole | 'all',
    status: 'all' as AdminUserStatus | 'all',
  };

  loading = false;
  loadError: string | null = null;

  rows = 10;
  first = 0;

  // Actions state
  mutatingId: string | null = null;

  users: AdminUserListItem[] = [
    {
      id: 'u-1001',
      name: 'P. Valle',
      email: 'p.valle@club.com',
      role: 'admin',
      status: 'active',
      createdAt: '2025-12-01',
    },
    {
      id: 'u-1002',
      name: 'Laura Sánchez',
      email: 'laura@club.com',
      role: 'coach',
      status: 'active',
      createdAt: '2025-12-10',
    },
    {
      id: 'u-1003',
      name: 'Invitado',
      email: 'invited@club.com',
      role: 'staff',
      status: 'blocked',
      createdAt: '2025-12-15',
    },
  ];

  constructor(
    private readonly api: UsersApiService,
    private readonly router: Router,
    private readonly toast: MessageService,
    private readonly confirmation: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = null;

    this.api
      .list({
        search: this.filters.search || undefined,
        role: this.filters.role === 'all' ? undefined : this.filters.role,
        status: this.filters.status === 'all' ? undefined : this.filters.status,
        page: Math.floor(this.first / this.rows) + 1,
        pageSize: this.rows,
      })
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res?.items && Array.isArray(res.items)) this.users = res.items;
        },
        error: (e: unknown) => {
          this.loading = false;
          const msg = e instanceof Error ? e.message : 'No se pudieron cargar los usuarios.';
          this.loadError = msg;
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
  }

  onPageChange(e: any): void {
    this.first = e?.first ?? 0;
    this.rows = e?.rows ?? this.rows;
    this.load();
  }

  clearFilters(): void {
    this.filters = { search: '', role: 'all', status: 'all' };
    this.first = 0;
    this.load();
  }

  get filteredUsers(): AdminUserListItem[] {
    // Client-side fallback filtering to keep UX working without backend.
    const q = this.filters.search.trim().toLowerCase();
    return this.users.filter((u) => {
      if (this.filters.role !== 'all' && u.role !== this.filters.role) return false;
      if (this.filters.status !== 'all' && u.status !== this.filters.status) return false;
      if (q) {
        const hay = `${u.name} ${u.email} ${u.role} ${u.status}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  roleLabel(role: AdminUserRole): string {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'coach':
        return 'Entrenador';
      case 'staff':
        return 'Staff';
      case 'player':
        return 'Jugador';
    }
  }

  statusLabel(status: AdminUserStatus): string {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'blocked':
        return 'Bloqueado';
      case 'pending':
        return 'Pendiente';
    }
  }

  statusSeverity(status: AdminUserStatus): 'success' | 'info' | 'warn' | 'danger' {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warn';
      case 'blocked':
        return 'danger';
    }
  }

  openNew(): void {
    this.router.navigate(['/admin/users/new']);
  }

  edit(user: AdminUserListItem): void {
    this.router.navigate(['/admin/users', user.id]);
  }

  toggleBlock(user: AdminUserListItem): void {
    if (this.mutatingId) return;
    const shouldBlock = user.status !== 'blocked';
    const actionLabel = shouldBlock ? 'Bloquear' : 'Desbloquear';

    this.confirmation.confirm({
      header: `${actionLabel} usuario`,
      message: `¿Quieres ${actionLabel.toLowerCase()} a ${user.name}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: actionLabel,
      rejectLabel: 'Cancelar',
      accept: () => {
        this.mutatingId = user.id;
        const req$ = shouldBlock ? this.api.block(user.id) : this.api.unblock(user.id);
        req$.subscribe({
          next: () => {
            this.mutatingId = null;
            // Stub: update locally
            this.users = this.users.map((u) =>
              u.id === user.id ? { ...u, status: shouldBlock ? 'blocked' : 'active' } : u,
            );
            this.toast.add({ severity: 'success', summary: 'Actualizado', detail: `Usuario ${actionLabel.toLowerCase()}ado.` });
          },
          error: (e: unknown) => {
            this.mutatingId = null;
            const msg = e instanceof Error ? e.message : 'No se pudo actualizar el usuario.';
            this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
          },
        });
      },
    });
  }

  confirmDelete(user: AdminUserListItem): void {
    if (this.mutatingId) return;
    this.confirmation.confirm({
      header: 'Eliminar usuario',
      message: `¿Quieres eliminar a ${user.name} (${user.email})?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => this.remove(user),
    });
  }

  private remove(user: AdminUserListItem): void {
    this.mutatingId = user.id;
    this.api.remove(user.id).subscribe({
      next: () => {
        this.mutatingId = null;
        // Stub: remove locally
        this.users = this.users.filter((u) => u.id !== user.id);
        this.toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Usuario eliminado (stub).' });
      },
      error: (e: unknown) => {
        this.mutatingId = null;
        const msg = e instanceof Error ? e.message : 'No se pudo eliminar el usuario.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
