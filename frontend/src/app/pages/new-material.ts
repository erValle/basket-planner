import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { PageHeader } from '../components/page-header/page-header';
import { AppShell } from '../layout/app-shell/app-shell';

import { EquipmentApi, EquipmentDto } from '../services/equipment.api';

@Component({
  selector: 'app-new-material',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    SelectModule,
    InputNumberModule,
    ToastModule,
    PageHeader,
    AppShell,
  ],
  templateUrl: './new-material.html',
  styleUrl: './new-material.css',
  providers: [MessageService],
})
export class NewMaterial {
  constructor(
    private readonly router: Router,
    private readonly api: EquipmentApi,
    private readonly toast: MessageService,
  ) {}

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

  saving = false;

  cancel(): void {
    this.router.navigateByUrl('/material');
  }

  save(): void {
    const name = this.form.name.trim();
    if (!name) return;

    if (this.saving) return;
    this.saving = true;

    const total = Math.max(0, Number(this.form.total) || 0);
    const available = Math.min(total, Math.max(0, Number(this.form.available) || 0));
    const status: 'available' | 'unavailable' = available <= 0 ? 'unavailable' : 'available';

    const payload: Partial<EquipmentDto> = {
      name,
      quantity: total,
      status,
      characteristics: { category: this.form.category },
    };

    this.api.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.toast.add({ severity: 'success', summary: 'Ok', detail: 'Material creado.' });
        this.router.navigateByUrl('/material');
      },
      error: (e: unknown) => {
        this.saving = false;
        const msg = e instanceof Error ? e.message : 'No se pudo crear el material.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: msg });
      },
    });
  }
}
