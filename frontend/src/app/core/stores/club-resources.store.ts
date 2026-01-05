import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import { EquipmentApi, EquipmentDto } from '../../services/equipment.api';
import { TeamsApi, TeamDto } from '../../services/teams.api';

export interface ClubResourcesSnapshot {
  clubId: number | null;
  equipment: EquipmentDto[];
  teams: TeamDto[];
  errors: {
    equipment?: string;
    teams?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class ClubResourcesStore {
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly teamsApi = inject(TeamsApi);

  private equipmentCache = new Map<string, Observable<EquipmentDto[]>>();
  private teamsCache = new Map<string, Observable<TeamDto[]>>();

  /**
   * Get equipment list for a club.
   * - cached per clubId
   * - shareReplay(1) so multiple pages/components reuse the same request
   */
  equipment$(clubId: number | null): Observable<EquipmentDto[]> {
    const key = clubId == null ? 'none' : String(clubId);
    const existing = this.equipmentCache.get(key);
    if (existing) return existing;

    const obs = this.equipmentApi
      .list({ clubId: clubId != null ? String(clubId) : undefined })
      .pipe(
        map((items) => items ?? []),
        catchError(() => of([])),
        shareReplay({ bufferSize: 1, refCount: true })
      );

    this.equipmentCache.set(key, obs);
    return obs;
  }

  teams$(clubId: number | null): Observable<TeamDto[]> {
    const key = clubId == null ? 'none' : String(clubId);
    const existing = this.teamsCache.get(key);
    if (existing) return existing;

    const obs = this.teamsApi
      .list({ clubId: clubId != null ? String(clubId) : undefined })
      .pipe(
        map((items) => items ?? []),
        catchError(() => of([])),
        shareReplay({ bufferSize: 1, refCount: true })
      );

    this.teamsCache.set(key, obs);
    return obs;
  }

  /**
   * Bust caches. Useful after creating/editing equipment/teams.
   */
  refresh(clubId?: number | null): void {
    if (clubId === undefined) {
      this.equipmentCache.clear();
      this.teamsCache.clear();
      return;
    }

    const key = clubId == null ? 'none' : String(clubId);
    this.equipmentCache.delete(key);
    this.teamsCache.delete(key);
  }
}
