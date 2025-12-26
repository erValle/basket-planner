import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-new-user-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6">
      <h1 class="text-2xl font-semibold">Crear usuario</h1>
      <p class="mt-1 text-sm text-slate-300">Mockup adaptado a Angular (pendiente de conectar a /api/users).</p>

      <form class="mt-6 grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label class="text-sm">Nombre</label>
          <input class="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/10" formControlName="name" />
        </div>
        <div>
          <label class="text-sm">Email</label>
          <input class="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/10" formControlName="email" />
        </div>
        <div>
          <label class="text-sm">Contraseña</label>
          <input
            type="password"
            class="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 ring-1 ring-white/10"
            formControlName="password"
          />
        </div>

        <button class="mt-2 w-fit rounded-xl bg-indigo-500 px-4 py-2 font-medium">Crear</button>
        <p *ngIf="message" class="text-sm text-slate-200">{{ message }}</p>
      </form>
    </section>
  `
})
export class NewUserPage {
  message: string | null = null;

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] })
  });

  submit() {
    this.message = 'Usuario aún no enviado a API.';
  }
}
