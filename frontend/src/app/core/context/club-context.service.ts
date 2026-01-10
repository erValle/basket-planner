import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { UserContextService } from '../auth/user-context.service';
import { ClubsApi, ClubDto } from '../../services/clubs.api';
import { PlayerClubsApiService } from '../../services/player-clubs.api';

/**
 * Frontend-only shared club/team selection.
 * This is intentionally lightweight and can be replaced by proper backend/user preferences later.
 */
@Injectable({ providedIn: 'root' })
export class ClubContextService {
	private readonly userContext = inject(UserContextService);
	private readonly playerClubsApi = inject(PlayerClubsApiService);
	private readonly clubsApi = inject(ClubsApi);

	private readonly clubsSubject = new BehaviorSubject<ClubDto[]>([]);
	readonly clubs$ = this.clubsSubject.asObservable();

	private readonly selectedClubIdSubject = new BehaviorSubject<number | null>(null);
	readonly selectedClubId$ = this.selectedClubIdSubject.asObservable();

	/**
	 * Loads clubs associated to the current user via /api/user-clubs.
	 * For coaches/admins without memberships, falls back to showing all clubs.
	 */
	refresh(): void {
		const user = this.userContext.getUserSnapshot();
		const userId = user?.id;
		const role = user?.role;

		if (!userId) {
			this.clubsSubject.next([]);
			this.selectedClubIdSubject.next(null);
			return;
		}

		// For admin/coach/technical_director: show all clubs (they manage multiple)
		// For players: show only their assigned clubs via user_clubs
		const isStaff = role === 'admin' || role === 'technical_director' || role === 'coach';

		if (isStaff) {
			// Admin, technical director and coach users can see all clubs
			this.clubsApi.list().subscribe({
				next: (items) => {
					this.clubsSubject.next(items ?? []);
					this.ensureSelectedClub(items ?? []);
				},
				error: () => {
					this.clubsSubject.next([]);
					this.selectedClubIdSubject.next(null);
				},
			});
			return;
		}

		// Players: load their club memberships
		this.playerClubsApi.listMemberships(String(userId)).subscribe({
			next: (res) => {
				const memberships = (res as any)?.items ?? (res as any)?.memberships ?? res ?? [];
				const clubIds = Array.isArray(memberships)
					? memberships
							.map((m: any) => m?.clubId)
							.filter((id: any) => id != null)
					: [];
				const uniqueClubIds = Array.from(new Set(clubIds.map((x: any) => Number(x)).filter((x) => Number.isFinite(x))));

				if (!uniqueClubIds.length) {
					this.clubsSubject.next([]);
					this.selectedClubIdSubject.next(null);
					return;
				}

				this.clubsApi.list().subscribe({
					next: (allClubs) => {
						const allowed = (allClubs ?? []).filter((c) => uniqueClubIds.includes(Number(c.id)));
						this.clubsSubject.next(allowed);
						this.ensureSelectedClub(allowed);
					},
					error: () => {
						// Can't resolve club names: keep empty list.
						this.clubsSubject.next([]);
						this.selectedClubIdSubject.next(null);
					},
				});
			},
			error: () => {
				// Fallback: if membership endpoint fails, show empty for players.
				this.clubsSubject.next([]);
				this.selectedClubIdSubject.next(null);
			},
		});
	}

	getClubsSnapshot(): ClubDto[] {
		return this.clubsSubject.value;
	}

	getSelectedClubIdSnapshot(): number | null {
		return this.selectedClubIdSubject.value;
	}

	setSelectedClubId(id: number | null): void {
		this.selectedClubIdSubject.next(id);
	}

	private ensureSelectedClub(clubs: ClubDto[]): void {
		const current = this.selectedClubIdSubject.value;
		if (current != null && clubs.some((c) => Number(c.id) === Number(current))) return;
		this.selectedClubIdSubject.next(clubs.length ? Number(clubs[0].id) : null);
	}
}
