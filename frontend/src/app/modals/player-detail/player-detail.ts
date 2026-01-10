import { Component, EventEmitter, Input, Output, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';

import { BpDialog } from '../../components/bp-dialog';
import { PlayerClubsApiService } from '../../services/player-clubs.api';
import { ClubsApi, ClubDto } from '../../services/clubs.api';
import { PlayerMembership } from '../../models/player-memberships';

type PlayerStatus = 'active' | 'revision';

export interface PlayerDetailModel {
  id: string;
  name: string;
  team: string;
  category: string;
  position: string;
  status: PlayerStatus;
  firstName: string;
  lastName: string;
  birthDate: string;
  dni: string;
  height: number;
  weight: number;
  dominantHand: string;
  club: string;
  currentTeam: string;
  weeklyLoad: string;
  lastFeedback: string;
  notes: string;
}

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    TagModule,
    TabsModule,
    TableModule,
    BpDialog,
    ToastModule,
    ConfirmDialogModule,
    DatePickerModule,
    SelectModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './player-detail.html',
  styleUrl: './player-detail.css',
  providers: [MessageService, ConfirmationService],
})
export class PlayerDetail {
  @Input({ required: true }) player!: PlayerDetailModel;

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<PlayerDetailModel>();

  activeTabIndex = 0;

  // Memberships tab state
  membershipsLoading = false;
  membershipsError: string | null = null;
  memberships: PlayerMembership[] = [];

  addDialogOpen = false;
  closeDialogOpen = false;
  selectedMembership: PlayerMembership | null = null;

  addForm = {
    clubId: null as number | null,
    startDate: null as Date | null,
    isPrimary: false,
  };

  closeForm = {
    endDate: null as Date | null,
  };

  // Transfer wizard
  transferDialogOpen = false;
  transferStep = 0;
  transferForm = {
    newClubId: null as number | null,
    transferDate: null as Date | null,
  };

  clubOptions: Array<{ label: string; value: number }> = [];
  private clubsById = new Map<number, ClubDto>();

  clubNameById(id: number | null | undefined): string {
    if (!id) return '';
    return this.clubsById.get(id)?.name ?? '';
  }

  savingMembership = false;

  private readonly cdr = inject(ChangeDetectorRef);

  constructor(
    private readonly api: PlayerClubsApiService,
    private readonly clubsApi: ClubsApi,
    private readonly toast: MessageService,
    private readonly confirm: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.loadClubs();
    this.loadMemberships();
  }

  private loadClubs(): void {
    this.clubsApi.list().subscribe({
      next: (clubs) => {
        this.clubsById = new Map<number, ClubDto>((clubs ?? []).map((c) => [c.id, c]));
        this.clubOptions = (clubs ?? []).map((c) => ({ label: c.name, value: c.id }));
      },
      error: () => {
        // Non-blocking
        this.clubOptions = [];
      },
    });
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    const err = error as any;
    
    // Check for API error response structure
    if (err?.error?.message) {
      return err.error.message;
    }
    
    // Check for HTTP error response
    if (err?.message) {
      return err.message;
    }
    
    return 'Ocurrió un error desconocido';
  }

  loadMemberships(): void {
    if (!this.player?.id) return;
    this.membershipsLoading = true;
    this.membershipsError = null;
    this.cdr.markForCheck();

    const mapToUi = (items: any[]) =>
      (items ?? []).map((it: any) => {
        const clubId = Number(it?.clubId);
        const clubName = String(it?.club?.name || this.clubsById.get(clubId)?.name || '');
        const startDate = it?.startDate ? String(it.startDate).slice(0, 10) : '';
        const endDate = it?.endDate ? String(it.endDate).slice(0, 10) : undefined;
        const status = endDate ? 'closed' : 'active';
        return {
          id: String(it?.id),
          playerId: String(it?.userId ?? this.player.id),
          clubId,
          clubName,
          startDate,
          endDate,
          isPrimary: !!it?.isPrimary,
          status,
        } as PlayerMembership;
      });

    // Prefer player history endpoint (includes club name). Fallback to user-clubs list.
    this.api.getPlayerHistory(this.player.id).subscribe({
      next: (rows) => {
        this.membershipsLoading = false;
        this.memberships = mapToUi(Array.isArray(rows) ? rows : []);
        this.cdr.markForCheck();
      },
      error: () => {
        // Honest UI: try fallback, but surface error if that also fails.
        this.api.listMemberships(this.player.id).subscribe({
          next: (res) => {
            this.membershipsLoading = false;
            const items = Array.isArray((res as any)?.items)
              ? (res as any).items
              : Array.isArray(res)
                ? (res as any)
                : [];
            this.memberships = mapToUi(items);
            this.cdr.markForCheck();
          },
          error: (e2: unknown) => {
            this.membershipsLoading = false;
            const msg = e2 instanceof Error ? e2.message : 'No se pudieron cargar las pertenencias.';
            this.membershipsError = msg;
            this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
            this.cdr.markForCheck();
          },
        });
      },
    });
  }

  openAdd(): void {
    this.addForm = { clubId: null, startDate: new Date(), isPrimary: false };
    this.addDialogOpen = true;
  }

  confirmAdd(): void {
    if (!this.player?.id) return;
    if (!this.addForm.clubId || !this.addForm.startDate) {
      this.toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'Club y fecha son obligatorios.' });
      return;
    }

    this.savingMembership = true;
    this.api
      .createMembership(this.player.id, {
        clubId: this.addForm.clubId,
        startDate: this.toIsoDate(this.addForm.startDate),
        isPrimary: this.addForm.isPrimary,
      })
      .subscribe({
        next: () => {
          this.savingMembership = false;
          this.addDialogOpen = false;
          this.toast.add({ severity: 'success', summary: 'Añadido', detail: 'Pertenencia añadida.' });
          this.loadMemberships();
        },
        error: (e: unknown) => {
          this.savingMembership = false;
          const msg = this.extractErrorMessage(e);
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
  }

  openClose(m: PlayerMembership): void {
    this.selectedMembership = m;
    this.closeForm = { endDate: new Date() };
    this.closeDialogOpen = true;
  }

  confirmClose(): void {
    if (!this.player?.id || !this.selectedMembership) return;
    if (!this.closeForm.endDate) {
      this.toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'Fecha fin es obligatoria.' });
      return;
    }
    this.savingMembership = true;
    this.api
      .closeMembership(this.selectedMembership.id, { endDate: this.toIsoDate(this.closeForm.endDate) })
      .subscribe({
        next: () => {
          this.savingMembership = false;
          this.closeDialogOpen = false;
          this.toast.add({ severity: 'success', summary: 'Cerrada', detail: 'Pertenencia cerrada.' });
          this.loadMemberships();
          this.selectedMembership = null;
        },
        error: (e: unknown) => {
          this.savingMembership = false;
          const msg = e instanceof Error ? e.message : 'No se pudo cerrar la pertenencia.';
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
  }

  markPrimary(m: PlayerMembership): void {
    if (!this.player?.id) return;
    if (m.status !== 'active') {
      this.toast.add({ severity: 'warn', summary: 'No disponible', detail: 'Solo se puede marcar como principal una pertenencia activa.' });
      return;
    }

    this.savingMembership = true;
    this.api.setPrimary(m.id).subscribe({
      next: () => {
        this.savingMembership = false;
        this.toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Principal actualizado.' });
        this.loadMemberships();
      },
      error: (e: unknown) => {
        this.savingMembership = false;
        const msg = e instanceof Error ? e.message : 'No se pudo marcar principal.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  openTransfer(): void {
    this.transferForm = { newClubId: null, transferDate: new Date() };
    this.transferStep = 0;
    this.transferDialogOpen = true;
  }

  canProceedTransfer(): boolean {
    return !!this.transferForm.newClubId && !!this.transferForm.transferDate;
  }

  nextTransfer(): void {
    if (this.transferStep === 0 && !this.canProceedTransfer()) {
      this.toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'Selecciona club y fecha.' });
      return;
    }
    this.transferStep = Math.min(1, this.transferStep + 1);
  }

  prevTransfer(): void {
    this.transferStep = Math.max(0, this.transferStep - 1);
  }

  confirmTransfer(): void {
    if (!this.player?.id || !this.transferForm.transferDate) return;
    if (!this.transferForm.newClubId) return;

    this.savingMembership = true;

    this.api
      .transfer(this.player.id, {
        newClubId: this.transferForm.newClubId!,
        transferDate: this.toIsoDate(this.transferForm.transferDate!),
      })
      .subscribe({
        next: () => {
          this.savingMembership = false;
          this.transferDialogOpen = false;
          this.toast.add({ severity: 'success', summary: 'Transferido', detail: 'Transferencia registrada.' });
          this.loadMemberships();
        },
        error: (e: unknown) => {
          this.savingMembership = false;
          const msg = this.extractErrorMessage(e);
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
  }

  onCancel() {
    this.cancel.emit();
  }

  onSave() {
    this.save.emit(structuredClone(this.player));
  }
}
