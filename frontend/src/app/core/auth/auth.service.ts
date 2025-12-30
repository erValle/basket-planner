import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppRole = 'ADMIN' | 'COACH' | 'STAFF' | 'PLAYER';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Frontend-only simulated auth state.
  private readonly role$ = new BehaviorSubject<AppRole>('ADMIN');

  getRoleSnapshot(): AppRole {
    return this.role$.value;
  }

  setRole(role: AppRole): void {
    this.role$.next(role);
  }
}
