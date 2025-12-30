import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService, MessageService } from 'primeng/api';

import { PlayerClubsApiService } from '../../services/player-clubs.api';
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
    DialogModule,
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
    club: '',
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
    newClub: '',
    transferDate: null as Date | null,
  };

  clubOptions = [
    { label: 'Club Ficticio Valladolid', value: 'Club Ficticio Valladolid' },
    { label: 'Club Norte', value: 'Club Norte' },
    { label: 'Club Sur', value: 'Club Sur' },
  ];

  savingMembership = false;

  constructor(
    private readonly api: PlayerClubsApiService,
    private readonly toast: MessageService,
    private readonly confirm: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.loadMemberships();
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  loadMemberships(): void {
    if (!this.player?.id) return;
    this.membershipsLoading = true;
    this.membershipsError = null;

    this.api.listMemberships(this.player.id).subscribe({
      next: (res) => {
        this.membershipsLoading = false;
        if (res?.items && Array.isArray(res.items)) {
          this.memberships = res.items;
          return;
        }

        // Backend not ready -> provide mock memberships (do not break UX)
        this.memberships = [
          {
            id: 'm-1',
            playerId: this.player.id,
            club: this.player.club || 'Club Ficticio Valladolid',
            startDate: '2024-09-01',
            endDate: undefined,
            isPrimary: true,
            status: 'active',
          },
          {
            id: 'm-2',
            playerId: this.player.id,
            club: 'Club Norte',
            startDate: '2023-09-01',
            endDate: '2024-06-30',
            isPrimary: false,
            status: 'closed',
          },
        ];
      },
      error: (e: unknown) => {
        this.membershipsLoading = false;
        const msg = e instanceof Error ? e.message : 'No se pudieron cargar las pertenencias.';
        this.membershipsError = msg;
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  openAdd(): void {
    this.addForm = { club: '', startDate: new Date(), isPrimary: false };
    this.addDialogOpen = true;
  }

  confirmAdd(): void {
    if (!this.player?.id) return;
    if (!this.addForm.club || !this.addForm.startDate) {
      this.toast.add({ severity: 'warn', summary: 'Revisa el formulario', detail: 'Club y fecha son obligatorios.' });
      return;
    }

    this.savingMembership = true;
    this.api
      .createMembership(this.player.id, {
        club: this.addForm.club,
        startDate: this.toIsoDate(this.addForm.startDate),
        isPrimary: this.addForm.isPrimary,
      })
      .subscribe({
        next: (res) => {
          this.savingMembership = false;
          this.addDialogOpen = false;
          // Stub: update locally
          const newM: PlayerMembership = {
            id: res?.id ?? `m-${Math.random().toString(16).slice(2)}`,
            playerId: this.player.id,
            club: this.addForm.club,
            startDate: this.toIsoDate(this.addForm.startDate!),
            endDate: undefined,
            isPrimary: this.addForm.isPrimary,
            status: 'active',
          };
          if (newM.isPrimary) {
            this.memberships = this.memberships.map((m) => ({ ...m, isPrimary: false }));
          }
          this.memberships = [newM, ...this.memberships];
          this.toast.add({ severity: 'success', summary: 'Añadido', detail: 'Pertenencia añadida (stub).' });
        },
        error: (e: unknown) => {
          this.savingMembership = false;
          const msg = e instanceof Error ? e.message : 'No se pudo añadir la pertenencia.';
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
      .closeMembership(this.player.id, this.selectedMembership.id, { endDate: this.toIsoDate(this.closeForm.endDate) })
      .subscribe({
        next: () => {
          this.savingMembership = false;
          this.closeDialogOpen = false;
          const end = this.toIsoDate(this.closeForm.endDate!);
          this.memberships = this.memberships.map((x) =>
            x.id === this.selectedMembership!.id
              ? { ...x, endDate: end, status: 'closed', isPrimary: false }
              : x,
          );
          this.toast.add({ severity: 'success', summary: 'Cerrada', detail: 'Pertenencia cerrada (stub).' });
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
    this.api.setPrimary(this.player.id, m.id).subscribe({
      next: () => {
        this.savingMembership = false;
        this.memberships = this.memberships.map((x) => ({ ...x, isPrimary: x.id === m.id }));
        this.toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Principal actualizado (stub).' });
      },
      error: (e: unknown) => {
        this.savingMembership = false;
        const msg = e instanceof Error ? e.message : 'No se pudo marcar principal.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }

  openTransfer(): void {
    this.transferForm = { newClub: '', transferDate: new Date() };
    this.transferStep = 0;
    this.transferDialogOpen = true;
  }

  canProceedTransfer(): boolean {
    return !!this.transferForm.newClub && !!this.transferForm.transferDate;
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
    if (!this.transferForm.newClub) return;

    this.savingMembership = true;
    this.api
      .transfer(this.player.id, {
        newClub: this.transferForm.newClub,
        transferDate: this.toIsoDate(this.transferForm.transferDate),
      })
      .subscribe({
        next: () => {
          this.savingMembership = false;
          this.transferDialogOpen = false;

          // Stub: close current primary + create new active primary
          const date = this.toIsoDate(this.transferForm.transferDate!);
          this.memberships = this.memberships.map((m) =>
            m.status === 'active' && m.isPrimary ? { ...m, endDate: date, status: 'closed', isPrimary: false } : m,
          );
          this.memberships = [
            {
              id: `m-${Math.random().toString(16).slice(2)}`,
              playerId: this.player.id,
              club: this.transferForm.newClub,
              startDate: date,
              endDate: undefined,
              isPrimary: true,
              status: 'active',
            },
            ...this.memberships,
          ];
          this.toast.add({ severity: 'success', summary: 'Transferido', detail: 'Transferencia registrada (stub).' });
        },
        error: (e: unknown) => {
          this.savingMembership = false;
          const msg = e instanceof Error ? e.message : 'No se pudo transferir el jugador.';
          this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
        },
      });
  }

  onCancel() {
    this.cancel.emit();
  }

  onSave() {
    this.save.emit(this.player);
  }
}
