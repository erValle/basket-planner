import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Frontend-only shared club/team selection.
 * This is intentionally lightweight and can be replaced by proper backend/user preferences later.
 */
@Injectable({ providedIn: 'root' })
export class ClubContextService {
	private readonly teams = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];

	private readonly selectedTeamSubject = new BehaviorSubject<string>(this.teams[0]);
	readonly selectedTeam$ = this.selectedTeamSubject.asObservable();

	getTeams(): string[] {
		return [...this.teams];
	}

	getSelectedTeam(): string {
		return this.selectedTeamSubject.value;
	}

	setSelectedTeam(team: string): void {
		if (!team) return;
		this.selectedTeamSubject.next(team);
	}
}
