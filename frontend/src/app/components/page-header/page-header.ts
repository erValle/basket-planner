import { Component, Input } from '@angular/core';

import { ButtonModule } from 'primeng/button';

@Component({
	selector: 'app-page-header',
	standalone: true,
	imports: [ButtonModule],
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

	/** Callback assigned from parent without re-emitting events. */
	@Input() action?: () => void;

	onActionClick(): void {
		this.action?.();
	}
}
