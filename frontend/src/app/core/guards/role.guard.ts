import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { MessageService } from 'primeng/api';

import { AuthService } from '../auth/auth.service';
import { hasRole, Role } from '../auth/roles';
import { resolveAllowedRolesFromUrl } from '../auth/permissions';

/**
 * Usage:
 *  canActivate: [roleGuard],
 *  data: { roles: ['ADMIN'] }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
    const toast = inject(MessageService);

  const fromMatrix = resolveAllowedRolesFromUrl(router.url);
  const fromRouteData = (route.data?.['roles'] ?? []) as Role[];
  const required = (fromMatrix ?? fromRouteData) as Role[];
  if (!required || required.length === 0) return true;

  const current = auth.getRoleSnapshot();
    if (hasRole(current, required)) return true;

    toast.add({ severity: 'warn', summary: 'Acceso denegado', detail: 'No tienes permisos para acceder a esta sección.' });
    router.navigateByUrl('/forbidden');
  return false;
};
