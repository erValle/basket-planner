import { Injectable } from '@angular/core';
import { distinctUntilChanged, map } from 'rxjs';

import { AuthService, AuthUser } from './auth.service';
import { Role } from './roles';

@Injectable({ providedIn: 'root' })
export class UserContextService {
    readonly session$;
    readonly user$;
    readonly role$;

    constructor(private readonly auth: AuthService) {
        this.session$ = this.auth.getSession$();
        this.user$ = this.session$.pipe(
            map((s) => s?.user ?? null),
            distinctUntilChanged(),
        );
        this.role$ = this.user$.pipe(
            map((u) => u?.role ?? null),
            distinctUntilChanged(),
        );
    }

    getUserSnapshot(): AuthUser | null {
        return this.auth.getSession()?.user ?? null;
    }

    getRoleSnapshot(): Role | null {
        return this.getUserSnapshot()?.role ?? null;
    }
}
