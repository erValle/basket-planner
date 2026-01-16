import { Component, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loading = false;
  error: string | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  submit() {
    if (this.loading) return;
    this.error = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.loading = true;
    this.auth
      .login(email ?? '', password ?? '')
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
			// Players don't have access to /dashboard.
			const role = this.auth.getRoleSnapshot();
			void this.router.navigateByUrl(role === 'player' ? '/player' : '/dashboard');
        },
        error: (e: unknown) => {
          // Map technical error messages to user-friendly ones
          let errorMessage = 'No se pudo iniciar sesión. Por favor, inténtalo de nuevo.';
          
          if (e instanceof Error) {
            const msgLower = e.message.toLowerCase();
            
            // Check for specific error messages
            if (msgLower.includes('invalid credentials') || msgLower.includes('credenciales')) {
              errorMessage = 'Correo electrónico o contraseña incorrectos.';
            } else if (msgLower.includes('not active') || msgLower.includes('no activ')) {
              errorMessage = 'Tu cuenta no está activa. Contacta con el administrador.';
            } else if (msgLower.includes('timeout') || msgLower.includes('tiempo') || e.constructor.name === 'TimeoutError') {
              errorMessage = 'El servidor no responde. Por favor, inténtalo más tarde.';
            } else if (msgLower.includes('network') || msgLower.includes('conexión') || msgLower.includes('failed to fetch')) {
              errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
            } else if (!msgLower.includes('request failed') && !msgLower.includes('unknown') && !msgLower.includes('error desconocido')) {
              // If it's a specific message from backend that's already user-friendly, use it
              errorMessage = e.message;
            }
          }
          
          this.error = errorMessage;
          this.cdr.detectChanges();
        },
      });
  }
}
