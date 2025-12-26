import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

type Step = { number: number; label: string };
type Option = { label: string; value: string };

@Component({
  selector: 'app-new-planification',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
  ],
  templateUrl: './new-planification.html',
  styleUrl: './new-planification.css',
})
export class NewPlanification {
  teams: string[] = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam: string = this.teams[0];

  currentStep = 1;

  steps: Step[] = [
    { number: 1, label: 'Datos básicos' },
    { number: 2, label: 'Destino' },
    { number: 3, label: 'Restricciones' },
    { number: 4, label: 'Revisión' },
    { number: 5, label: 'Confirmación' },
  ];

  objectiveOptions: Option[] = [
    { label: 'Mejora del tiro exterior', value: 'Mejora del tiro exterior' },
    { label: 'Defensa individual', value: 'Defensa individual' },
    { label: 'Manejo de balón', value: 'Manejo de balón' },
    { label: 'Condición física', value: 'Condición física' },
  ];

  intensityOptions: Option[] = [
    { label: 'Baja', value: 'Baja' },
    { label: 'Media', value: 'Media' },
    { label: 'Alta', value: 'Alta' },
  ];

  formData = {
    name: '',
    duration: 90,
    summary: '',
    objective: 'Mejora del tiro exterior',
    intensity: 'Media',
  };

  cancel() {
    // TODO: navigate back when we have a dedicated listing page
  }

  back() {
    this.currentStep = Math.max(1, this.currentStep - 1);
  }

  next() {
    this.currentStep = Math.min(5, this.currentStep + 1);
  }
}
