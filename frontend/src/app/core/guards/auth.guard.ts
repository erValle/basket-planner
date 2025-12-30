import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = () => {
  // Frontend-only: if we ever add a real token/session, check it here.
  const auth = inject(AuthService);
  const router = inject(Router);

  const role = auth.getRoleSnapshot();
  if (role) return true;

  router.navigateByUrl('/login');
  return false;
};
