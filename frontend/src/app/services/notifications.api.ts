import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

import { ApiClient } from './api-client';
import { AppNotification, NotificationsListResponse } from '../models/notification';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly api = inject(ApiClient);

  list() {
    return this.api.get<NotificationsListResponse>('/api/notifications').pipe(
      map((res) => res ?? { items: [] })
    );
  }

  markRead(id: string) {
    return this.api.post<{ ok: true }>(`/api/notifications/${encodeURIComponent(id)}/read`, {}).pipe(
      map((res) => res ?? { ok: true as const })
    );
  }

  markAllRead() {
    return this.api.post<{ ok: true }>('/api/notifications/read-all', {}).pipe(
      map((res) => res ?? { ok: true as const })
    );
  }
}
