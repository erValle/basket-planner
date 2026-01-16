import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { HasPermissionDirective } from '../../core/auth/has-permission.directive';

@Component({
	selector: 'app-page-header',
	standalone: true,
	imports: [CommonModule, ButtonModule, HasPermissionDirective],
	templateUrl: './page-header.html',
})
export class PageHeader {
	@Input({ required: true }) title!: string;
	@Input() subtitle?: string;

	/** Optional top-right button */
	@Input() actionLabel?: string;
	@Input() actionIcon?: string;
	@Input() actionSeverity: 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' = 'primary';
	@Input() actionOutlined = false;
	@Input() actionDisabled = false;
	@Input() actionAriaLabel?: string;
	@Input() actionPermission?: string; // e.g., 'clubs.create'

	/** Callback assigned from parent without re-emitting events. */
	@Input() action?: () => void;

	onActionClick(): void {
		this.action?.();
	}
}
