import { Component } from '@angular/core';
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
  styleUrl: './login.css',
})
export class Login {
  loading = false;
  error: string | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
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
    console.log('[login] submit', { email });
    this.loading = true;
    this.auth
      .login(email ?? '', password ?? '')
      .pipe(
        finalize(() => {
          console.log('[login] finalize - stop loading');
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
			console.log('[login] next - session saved, navigating');
			// Players don't have access to /dashboard.
			const role = this.auth.getRoleSnapshot();
			void this.router.navigateByUrl(role === 'player' ? '/player' : '/dashboard');
        },
        error: (e: unknown) => {
			console.log('[login] error', e);
          this.error = e instanceof Error ? e.message : 'No se pudo iniciar sesión.';
        },
      });
  }
}
