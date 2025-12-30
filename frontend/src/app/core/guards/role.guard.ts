import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { AuthService, AppRole } from '../auth/auth.service';

/**
 * Usage:
 *  canActivate: [roleGuard],
 *  data: { roles: ['ADMIN'] }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const required = (route.data?.['roles'] ?? []) as AppRole[];
  if (!required || required.length === 0) return true;

  const current = auth.getRoleSnapshot();
  if (required.includes(current)) return true;

  router.navigateByUrl('/dashboard');
  return false;
};
