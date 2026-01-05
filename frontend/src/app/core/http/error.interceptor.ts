import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { MessageService } from 'primeng/api';
import { AuthService } from '../auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
	const toast = inject(MessageService);
	const auth = inject(AuthService);

	return next(req).pipe(
		catchError((err: unknown) => {
			if (err instanceof HttpErrorResponse) {
				if (err.status === 401) {
					toast.add({ severity: 'warn', summary: 'Sesión', detail: 'Tu sesión ha expirado. Vuelve a iniciar sesión.' });
					auth.logout();
				}
				if (err.status === 403) {
					toast.add({ severity: 'warn', summary: 'Acceso denegado', detail: 'No tienes permisos para esta acción.' });
				}

				const msg = (err.error as any)?.message ?? err.message ?? 'Error de red.';
				// Avoid duplicate noisy toasts for 401 handled above.
				if (err.status !== 401) {
					toast.add({ severity: 'error', summary: 'Error', detail: msg });
				}
			}

			return throwError(() => (err instanceof Error ? err : new Error('Request failed')));
		})
	);
};
