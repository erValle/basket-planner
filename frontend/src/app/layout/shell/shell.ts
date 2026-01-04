import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { NAV_ITEMS, canAccess } from '../../core/auth/permissions';
import { ROLE_LABELS, type Role } from '../../core/auth/roles';
import { AuthService } from '../../core/auth/auth.service';
import { UserContextService } from '../../core/auth/user-context.service';
import { ClubContextService } from '../../core/context/club-context.service';

@Component({
  selector: 'bp-shell',
  imports: [RouterLink, RouterOutlet, NgFor, NgIf, AsyncPipe, FormsModule, SelectModule],
  templateUrl: './shell.html',
  styleUrls: ['./shell.css'],
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly userContext = inject(UserContextService);
  private readonly clubContext = inject(ClubContextService);

  readonly user$ = this.userContext.user$;
  readonly role$ = this.userContext.role$;

  readonly clubOptions = this.clubContext.clubs$;
  selectedClubId = this.clubContext.getSelectedClubIdSnapshot();

  constructor() {
    this.clubContext.refresh();
  }

  get showClubSelector(): boolean {
    const r = this.auth.getRoleSnapshot();
    return r === 'admin' || r === 'coach';
  }

  onSelectedClubChange(value: number | null): void {
    if (value == null) return;
    this.selectedClubId = value;
    this.clubContext.setSelectedClubId(value);
  }

  readonly navItems$ = computed(() => {
    // Note: userContext.role$ is an observable; computed can't subscribe.
    // We'll keep this as a simple constant list and filter in template using role$.
    return NAV_ITEMS;
  });

  roleLabel(role: Role | null | undefined): string {
    if (!role) return '—';
    return ROLE_LABELS[role] ?? role;
  }

  canSee(itemRoles: Role[] | undefined, role: Role | null | undefined): boolean {
    if (!role) return false;
    return canAccess(role, itemRoles);
  }

  logout(): void {
    this.auth.logout();
  }
}
