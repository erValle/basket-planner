import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from './auth.service';
import { hasActionPermission } from './action-permissions';
import { Role } from './roles';

/**
 * Structural directive to show/hide elements based on action permissions
 * 
 * Usage:
 * <button *hasPermission="'clubs.create'">Nuevo Club</button>
 * <button *hasPermission="['teams.edit', 'teams.delete']; operator: 'or'">Editar</button>
 */
@Directive({
	selector: '[hasPermission]',
	standalone: true,
})
export class HasPermissionDirective implements OnInit, OnDestroy {
	private readonly authService = inject(AuthService);
	private readonly templateRef = inject(TemplateRef<any>);
	private readonly viewContainer = inject(ViewContainerRef);
	private readonly destroy$ = new Subject<void>();

	private permissions: string[] = [];
	private operator: 'and' | 'or' = 'and';

	@Input()
	set hasPermission(value: string | string[]) {
		this.permissions = Array.isArray(value) ? value : [value];
		this.updateView();
	}

	@Input()
	set hasPermissionOperator(value: 'and' | 'or') {
		this.operator = value;
		this.updateView();
	}

	ngOnInit(): void {
		// Subscribe to session changes to react to role changes
		this.authService.getSession$()
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => {
				this.updateView();
			});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private hasView = false;

	private updateView(): void {
		const role = this.authService.getRoleSnapshot();
		const hasPermission = this.checkPermissions(role);

		if (hasPermission && !this.hasView) {
			this.viewContainer.createEmbeddedView(this.templateRef);
			this.hasView = true;
		} else if (!hasPermission && this.hasView) {
			this.viewContainer.clear();
			this.hasView = false;
		}
	}

	private checkPermissions(role: Role | null): boolean {
		if (!role || this.permissions.length === 0) {
			return false;
		}

		if (this.operator === 'or') {
			// Has at least one permission
			return this.permissions.some(permission => {
				const [resource, action] = permission.split('.');
				return hasActionPermission(role, resource, action as any);
			});
		} else {
			// Has all permissions
			return this.permissions.every(permission => {
				const [resource, action] = permission.split('.');
				return hasActionPermission(role, resource, action as any);
			});
		}
	}
}
