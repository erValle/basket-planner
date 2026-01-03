import { inject, Injectable } from '@angular/core';
import { catchError, map, of } from 'rxjs';

import { ApiClient } from './api-client';
import { AppNotification, NotificationsListResponse } from '../models/notification';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly api = inject(ApiClient);

  list() {
    return this.api.get<NotificationsListResponse>('/api/notifications').pipe(
      map((res) => res ?? { items: this.mock() }),
      catchError(() => of({ items: this.mock() }))
    );
  }

  markRead(id: string) {
    return this.api.post<{ ok: true }>(`/api/notifications/${encodeURIComponent(id)}/read`, {}).pipe(
      map((res) => res ?? { ok: true as const }),
      catchError(() => of({ ok: true as const }))
    );
  }

  markAllRead() {
    return this.api.post<{ ok: true }>('/api/notifications/read-all', {}).pipe(
      map((res) => res ?? { ok: true as const }),
      catchError(() => of({ ok: true as const }))
    );
  }

  private mock(): AppNotification[] {
    const now = Date.now();
    return [
      {
        id: 'n-1',
        title: 'Entrenamiento completado',
        message: 'El recomendador ha generado una nueva versión (rec-1.4.3).',
        createdAt: new Date(now - 1000 * 60 * 28).toISOString(),
        type: 'success',
        read: false,
      },
      {
        id: 'n-2',
        title: 'Exportación con fallos',
        message: 'Una exportación diaria ha fallado. Revisa los logs.',
        createdAt: new Date(now - 1000 * 60 * 60 * 7).toISOString(),
        type: 'warn',
        read: false,
      },
      {
        id: 'n-3',
        title: 'Nueva auditoría disponible',
        message: 'Se ha registrado una acción de administración en el sistema.',
        createdAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
        type: 'info',
        read: true,
      },
    ];
  }
}
