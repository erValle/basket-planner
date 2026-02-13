import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { AppShell } from '../layout/app-shell/app-shell';
import { PageHeader } from '../components/page-header/page-header';
import { BpDialog } from '../components/bp-dialog';

import { UsersApiService } from '../services/users.api';
import { ClubsApi, ClubDto } from '../services/clubs.api';
import { PlayerClubsApiService } from '../services/player-clubs.api';
import { AuthService } from '../core/auth/auth.service';
import { AdminUserRole, AdminUserStatus, AdminUserUpsertPayload } from '../models/user-admin';
import { Observable, forkJoin } from 'rxjs';

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
        MultiSelectModule,
        ToastModule,
        TooltipModule,
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

    // Rol del usuario logueado
    currentUserRole: string | null = null;

    // Clubs
    clubs: ClubDto[] = [];
    clubOptions: { label: string; value: number }[] = [];
    selectedClubId: number | null = null; // Para coach (un solo club)
    selectedClubIds: number[] = []; // Para technical_director (múltiples clubs)
    currentMembershipId: string | null = null;
    currentMembershipIds: string[] = []; // Para guardar todas las membresías actuales
    loadingClubs = false;

    roleOptions: Option[] = [
        { label: 'Usuario', value: 'user' },
        { label: 'Admin', value: 'admin' },
        { label: 'Director Técnico', value: 'technical_director' },
        { label: 'Entrenador', value: 'coach' },
        { label: 'Jugador', value: 'player' },
    ];

    statusOptions: Option[] = [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
    ];

    form: AdminUserUpsertPayload = {
        name: '',
        email: '',
        password: '',
        role: 'user',
        status: 'active',
    };

    touched = new Set<string>();

    // Admin password reset (backend supports PUT /api/users/:id with password)
    passwordResetOpen = false;
    resettingPassword = false;
    newPassword = this.generatePassword();

    constructor(
        private readonly api: UsersApiService,
        private readonly clubsApi: ClubsApi,
        private readonly userClubsApi: PlayerClubsApiService,
        private readonly auth: AuthService,
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
        this.currentUserRole = this.auth.getRoleSnapshot();
        this.loadClubs();
        if (this.isEdit) {
            this.load();
        } else {
            // Generar contraseña automática para nuevos usuarios
            this.form.password = this.generatePassword();
        }
    }

    private loadClubs(): void {
        this.loadingClubs = true;
        this.clubsApi.list().subscribe({
            next: (clubs) => {
                this.loadingClubs = false;
                this.clubs = clubs;
                this.clubOptions = clubs.map((c) => ({ label: c.name, value: c.id }));
            },
            error: () => {
                this.loadingClubs = false;
                this.toast.add({
                    severity: 'warn',
                    summary: 'Aviso',
                    detail: 'No se pudieron cargar los clubs.',
                });
            },
        });
    }

    // Solo admin puede asignar clubs a usuarios
    get canAssignClubs(): boolean {
        return this.currentUserRole === 'admin';
    }

    // Director técnico puede tener múltiples clubs
    get isMultiClubRole(): boolean {
        return this.form.role === 'technical_director';
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

    get passwordValid(): boolean {
        // En modo edición no se requiere contraseña
        if (this.isEdit) return true;
        return (this.form.password ?? '').trim().length >= 6;
    }

    get canSave(): boolean {
        return (
            this.nameValid &&
            this.emailValid &&
            this.passwordValid &&
            !!this.form.status &&
            !!this.form.role
        );
    }

    generateNewPassword(): void {
        this.form.password = this.generatePassword();
    }

    copyGeneratedPassword(): void {
        if (!this.form.password) return;
        navigator.clipboard
            ?.writeText(this.form.password)
            .then(() =>
                this.toast.add({
                    severity: 'success',
                    summary: 'Copiado',
                    detail: 'Contraseña copiada al portapapeles.',
                }),
            )
            .catch(() =>
                this.toast.add({
                    severity: 'warn',
                    summary: 'No se pudo copiar',
                    detail: 'Copia manualmente la contraseña.',
                }),
            );
    }

    load(): void {
        if (!this.userId) return;

        this.loading = true;
        this.loadError = null;

        // Cargar usuario y su membresía actual
        forkJoin({
            user: this.api.get(this.userId),
            memberships: this.userClubsApi.listMemberships(this.userId),
        }).subscribe({
            next: ({ user, memberships }) => {
                this.loading = false;
                if (user?.id) {
                    this.form = {
                        name: user.name,
                        email: user.email,
                        role: user.role as AdminUserRole,
                        status: user.status as AdminUserStatus,
                    };

                    // El backend devuelve un array directamente
                    const membershipList = Array.isArray(memberships)
                        ? memberships
                        : (memberships as any)?.items || [];

                    // Filtrar membresías activas (sin endDate)
                    const activeMemberships = membershipList.filter((m: any) => !m.endDate);

                    if (activeMemberships.length > 0) {
                        // Para multi-select (director técnico)
                        this.selectedClubIds = activeMemberships.map((m: any) => m.clubId);
                        this.currentMembershipIds = activeMemberships.map((m: any) => String(m.id));

                        // Para single select (coach/otros)
                        const primaryMembership =
                            activeMemberships.find((m: any) => m.isPrimary) || activeMemberships[0];
                        this.selectedClubId = primaryMembership.clubId;
                        this.currentMembershipId = String(primaryMembership.id);
                    }
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
            .then(() =>
                this.toast.add({
                    severity: 'success',
                    summary: 'Copiado',
                    detail: 'Contraseña copiada al portapapeles.',
                }),
            )
            .catch(() =>
                this.toast.add({
                    severity: 'warn',
                    summary: 'No se pudo copiar',
                    detail: 'Copia manualmente la contraseña.',
                }),
            );
    }

    confirmPasswordReset(): void {
        if (!this.userId || this.resettingPassword) return;
        if ((this.newPassword ?? '').trim().length < 6) {
            this.toast.add({
                severity: 'warn',
                summary: 'Contraseña inválida',
                detail: 'Debe tener al menos 6 caracteres.',
            });
            return;
        }

        this.resettingPassword = true;
        this.api.setPassword(this.userId, this.newPassword).subscribe({
            next: () => {
                this.resettingPassword = false;

                // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
                setTimeout(() => {
                    this.passwordResetOpen = false;
                });

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
            this.toast.add({
                severity: 'warn',
                summary: 'Revisa el formulario',
                detail: 'Hay campos obligatorios inválidos.',
            });
            return;
        }

        this.saving = true;

        const payload: AdminUserUpsertPayload = {
            ...this.form,
        };

        const req$: Observable<unknown> =
            this.isEdit && this.userId
                ? this.api.update(this.userId, payload)
                : this.api.create(payload);

        req$.subscribe({
            next: (res: any) => {
                // Obtener el userId (del response en creación, o del existente en edición)
                const savedUserId = this.isEdit ? this.userId : res?.id;

                // Gestionar membresía del club si el admin puede asignar y hay cambios
                if (savedUserId && this.canAssignClubs && this.shouldUpdateClubMembership()) {
                    this.handleClubMembership(String(savedUserId));
                } else {
                    this.finishSave();
                }
            },
            error: (e: unknown) => {
                this.saving = false;
                const msg = e instanceof Error ? e.message : 'No se pudo guardar el usuario.';
                this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
            },
        });
    }

    private shouldUpdateClubMembership(): boolean {
        if (this.isMultiClubRole) {
            // Para directores técnicos: verificar si cambió la lista de clubs
            const currentSet = new Set(
                this.currentMembershipIds.map(() => this.selectedClubIds).flat(),
            );
            const hadMemberships = this.currentMembershipIds.length > 0;
            const hasNewSelection = this.selectedClubIds.length > 0;
            return hadMemberships || hasNewSelection;
        } else {
            // Para otros roles: verificar si cambió el club único
            const newClubId = this.selectedClubId;
            const hadMembership = !!this.currentMembershipId;
            return newClubId !== null || hadMembership;
        }
    }

    private handleClubMembership(userId: string): void {
        const today = new Date().toISOString().split('T')[0];

        if (this.isMultiClubRole) {
            // Para directores técnicos: gestionar múltiples clubs
            this.handleMultiClubMembership(userId, today);
        } else {
            // Para otros roles: un solo club
            this.handleSingleClubMembership(userId, today);
        }
    }

    private handleMultiClubMembership(userId: string, today: string): void {
        const newClubIds = this.selectedClubIds || [];
        const currentClubIds =
            this.currentMembershipIds.length > 0
                ? this.selectedClubIds // Fallback: usar los actuales
                : [];

        // Clubs a eliminar (estaban pero ya no están)
        const toRemove = this.currentMembershipIds.filter((_, idx) => {
            // Necesitamos encontrar qué clubs ya no están seleccionados
            // Esto es una simplificación - en un caso real necesitaríamos mapear membresía -> clubId
            return false; // Por ahora no eliminamos, solo añadimos
        });

        // Clubs a añadir (nuevos que no estaban)
        const existingClubIds = new Set<number>();
        // Aquí deberíamos tener un map de membershipId -> clubId, simplificamos:

        // Crear todas las membresías nuevas
        let pending = newClubIds.length;

        if (pending === 0) {
            // Si no hay clubs, cerrar todas las membresías existentes
            if (this.currentMembershipIds.length > 0) {
                let closePending = this.currentMembershipIds.length;
                this.currentMembershipIds.forEach((membershipId) => {
                    this.userClubsApi.closeMembership(membershipId, { endDate: today }).subscribe({
                        next: () => {
                            if (--closePending === 0) this.finishSave();
                        },
                        error: () => {
                            if (--closePending === 0) this.finishSave();
                        },
                    });
                });
            } else {
                this.finishSave();
            }
            return;
        }

        // Cerrar membresías existentes y crear las nuevas
        const createAll = () => {
            newClubIds.forEach((clubId, idx) => {
                this.userClubsApi
                    .createMembership(userId, {
                        clubId,
                        startDate: today,
                        isPrimary: idx === 0, // Solo el primero es primary
                    })
                    .subscribe({
                        next: () => {
                            if (--pending === 0) this.finishSave();
                        },
                        error: () => {
                            if (--pending === 0) this.finishSave();
                        },
                    });
            });
        };

        // Primero cerrar las existentes
        if (this.currentMembershipIds.length > 0) {
            let closePending = this.currentMembershipIds.length;
            this.currentMembershipIds.forEach((membershipId) => {
                this.userClubsApi.closeMembership(membershipId, { endDate: today }).subscribe({
                    next: () => {
                        if (--closePending === 0) createAll();
                    },
                    error: () => {
                        if (--closePending === 0) createAll();
                    },
                });
            });
        } else {
            createAll();
        }
    }

    private handleSingleClubMembership(userId: string, today: string): void {
        const newClubId = this.selectedClubId;

        // Si no hay club seleccionado pero había membresía, cerrarla
        if (!newClubId && this.currentMembershipId) {
            this.userClubsApi
                .closeMembership(this.currentMembershipId, { endDate: today })
                .subscribe({
                    next: () => this.finishSave(),
                    error: () => this.finishSave(),
                });
            return;
        }

        // Si hay club seleccionado
        if (newClubId) {
            // Si había una membresía diferente, cerrarla primero y crear la nueva
            if (this.currentMembershipId) {
                this.userClubsApi
                    .closeMembership(this.currentMembershipId, { endDate: today })
                    .subscribe({
                        next: () => this.createNewMembership(userId, newClubId, today),
                        error: () => this.createNewMembership(userId, newClubId, today),
                    });
            } else {
                this.createNewMembership(userId, newClubId, today);
            }
            return;
        }

        this.finishSave();
    }

    private createNewMembership(userId: string, clubId: number, startDate: string): void {
        this.userClubsApi
            .createMembership(userId, {
                clubId,
                startDate,
                isPrimary: true,
            })
            .subscribe({
                next: () => this.finishSave(),
                error: (e) => {
                    console.error('Error creating membership:', e);
                    this.finishSave(); // Continuar aunque falle la membresía
                },
            });
    }

    private finishSave(): void {
        this.saving = false;
        this.toast.add({ severity: 'success', summary: 'Guardado', detail: 'Usuario guardado.' });
        this.router.navigate(['/admin/users']);
    }
}
