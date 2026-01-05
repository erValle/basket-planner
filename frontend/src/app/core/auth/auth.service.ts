import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, of, tap, timeout } from 'rxjs';

import { ApiClient } from '../../services/api-client';
import { Role } from './roles';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role | null;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

const STORAGE_KEY = 'bp.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);

  private readonly session$ = new BehaviorSubject<AuthSession | null>(this.readSession());

  /**
   * POST /api/auth/login
   */
  login(email: string, password: string) {
    return this.api.post<AuthSession>('/api/auth/login', { email, password }).pipe(
      timeout({ first: 10000 }),
      // Backend currently may not return user.name for seeded accounts.
      // Keep the session shape stable to avoid downstream UI hangs.
      map((session) => ({
        ...session,
        user: {
          ...session.user,
          name: session.user?.name ?? session.user?.email ?? 'Usuario',
        },
      })),
      tap((session) => this.setSession(session)),
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.session$.next(null);
    this.router.navigateByUrl('/login');
  }

  getSession(): AuthSession | null {
    return this.session$.value;
  }

  getSession$() {
    return this.session$.asObservable();
  }

  isAuthenticated(): boolean {
    return Boolean(this.session$.value?.token);
  }

  getRoleSnapshot(): Role | null {
    return this.session$.value?.user.role ?? null;
  }

  private setSession(session: AuthSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    this.session$.next(session);
  }

  private readSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed?.token || !parsed?.user) return null;
      return parsed;
    } catch {
      return null;
    }
  }
}
