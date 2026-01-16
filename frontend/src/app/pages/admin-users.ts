import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';

import { BehaviorSubject, of, map, shareReplay, startWith, switchMap, catchError } from 'rxjs';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';

import { UsersApiService } from '../services/users.api';
import { AdminUserListItem, AdminUserRole, AdminUserStatus } from '../models/user-admin';

type Option<T extends string> = { label: string; value: T | 'all' };

interface AdminUsersVm {
  items: AdminUserListItem[];
  pageItems: AdminUserListItem[];
  loading: boolean;
  error: string | null;
  total: number;
}

@Component({
  selector: 'app-admin-users',
  imports: [
    CommonModule,
    FormsModule,
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
  styleUrl: './admin-users.scss',
  providers: [MessageService, ConfirmationService],
})
export class AdminUsers {
  roleOptions: Option<AdminUserRole>[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Admin', value: 'admin' },
    { label: 'Director Técnico', value: 'technical_director' },
    { label: 'Entrenador', value: 'coach' },
    { label: 'Jugador', value: 'player' },
    { label: 'Usuario', value: 'user' },
  ];

  statusOptions: Option<AdminUserStatus>[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  filters = {
    search: '',
    role: 'all' as AdminUserRole | 'all',
    status: 'all' as AdminUserStatus | 'all',
  };

  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  rows = 10;
  first = 0;
  totalRecords = 0;

  // Actions state
  mutatingId: string | null = null;

  readonly vm$ = this.refresh$.pipe(
    switchMap(() => {
      return this.api
        .list({
          search: this.filters.search || undefined,
          role: this.filters.role === 'all' ? undefined : this.filters.role,
          status: this.filters.status === 'all' ? undefined : this.filters.status,
          page: 1,
          pageSize: 2000,
        } as any)
        .pipe(
          map((res: any) => {
            const rows = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
            const items = rows.map((u: any) => ({
              id: String(u.id),
              name: (u.name ?? '').toString(),
              email: (u.email ?? '').toString(),
              role: (u.role ?? 'player') as AdminUserRole,
              status: (u.status ?? 'active') as AdminUserStatus,
              createdAt: u.createdAt ? String(u.createdAt).slice(0, 19).replace('T', ' ') : '',
            })) as AdminUserListItem[];

            const total = items.length;
            const pageItems = items.slice(this.first, this.first + this.rows);
            this.totalRecords = total;

            return { items, pageItems, loading: false, error: null, total } as AdminUsersVm;
          }),
          startWith({ items: [], pageItems: [], loading: true, error: null, total: 0 } as AdminUsersVm),
          catchError((e: unknown) => {
            // No mostrar errores de validación (400), solo errores de servidor
            if (e && typeof e === 'object' && 'status' in e && (e as any).status === 400) {
              return of({ items: [], pageItems: [], loading: false, error: null, total: 0 } as AdminUsersVm);
            }
            const error = e instanceof Error ? e.message : 'No se pudieron cargar los usuarios.';
            return of({ items: [], pageItems: [], loading: false, error, total: 0 } as AdminUsersVm);
          }),
        );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor(
    private readonly api: UsersApiService,
    private readonly router: Router,
    private readonly toast: MessageService,
    private readonly confirmation: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.refresh$.next();
  }

  onPageChange(e: any): void {
    this.first = e?.first ?? 0;
    this.rows = e?.rows ?? this.rows;
    this.refresh();
  }

  clearFilters(): void {
    this.filters = { search: '', role: 'all', status: 'all' };
    this.first = 0;
    this.refresh();
  }

  roleLabel(role: AdminUserRole | null): string {
    if (!role) return '—';
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'technical_director':
        return 'Director Técnico';
      case 'coach':
        return 'Entrenador';
      case 'player':
        return 'Jugador';
      case 'user':
        return 'Usuario';
      default:
        return '—';
    }
  }

  statusLabel(status: AdminUserStatus): string {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'inactive':
        return 'Inactivo';
      default:
        return 'Activo';
    }
  }

  statusSeverity(status: AdminUserStatus): 'success' | 'info' | 'warn' | 'danger' {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'danger';
      default:
        return 'success';
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
    const shouldBlock = user.status !== 'inactive';
    const actionLabel = shouldBlock ? 'Desactivar' : 'Activar';

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
            this.refresh();
            this.toast.add({ severity: 'success', summary: 'Actualizado', detail: `Usuario ${actionLabel.toLowerCase()}do.` });
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
        this.refresh();
        this.toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Usuario eliminado.' });
      },
      error: (e: unknown) => {
        this.mutatingId = null;
        const msg = e instanceof Error ? e.message : 'No se pudo eliminar el usuario.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
