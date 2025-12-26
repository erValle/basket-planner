import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div
      class="min-h-screen flex items-center justify-center px-4"
      style="background: radial-gradient(circle at top left, #111827, #020617)"
    >
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h1 class="text-xl font-semibold">Iniciar sesión</h1>
        <p class="mt-1 text-sm text-slate-300">Accede a tu club y gestiona entrenamientos.</p>

        <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <div>
            <label class="text-sm text-slate-200">Email</label>
            <input
              class="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400"
              type="email"
              placeholder="correo@club.com"
              formControlName="email"
            />
          </div>

          <div>
            <label class="text-sm text-slate-200">Contraseña</label>
            <input
              class="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-indigo-400"
              type="password"
              placeholder="••••••••"
              formControlName="password"
            />
          </div>

          <button
            class="w-full rounded-xl bg-indigo-500 py-2 font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
            type="submit"
            [disabled]="form.invalid || loading"
          >
            {{ loading ? 'Entrando…' : 'Entrar' }}
          </button>

          <p class="text-center text-xs text-slate-300">
            ¿No tienes usuario?
            <a routerLink="/users/new" class="underline hover:text-white">Crear usuario</a>
          </p>

          <p *ngIf="error" class="text-sm text-red-300">{{ error }}</p>
        </form>
      </div>
    </div>
  `
})
export class LoginPage {
  loading = false;
  error: string | null = null;

  form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  submit() {
    this.error = null;
    this.loading = true;

    // Mockup-only behavior for now (API wiring comes next)
    setTimeout(() => {
      this.loading = false;
      this.error = 'Login aún no conectado a API (/api/auth/login).';
    }, 400);
  }
}
