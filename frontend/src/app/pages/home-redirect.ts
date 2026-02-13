import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

/**
 * Componente que redirige al usuario a su página de inicio según su rol:
 * - Admin -> Monitorización
 * - Director Técnico / Entrenador -> Dashboard
 * - Jugador -> Panel de jugador
 */
@Component({
    selector: 'app-home-redirect',
    template:
        '<div class="flex items-center justify-center h-screen"><p class="text-zinc-400">Redirigiendo...</p></div>',
    standalone: true,
})
export class HomeRedirect implements OnInit {
    private readonly router = inject(Router);
    private readonly auth = inject(AuthService);

    ngOnInit(): void {
        const role = this.auth.getRoleSnapshot();

        switch (role) {
            case 'admin':
                this.router.navigate(['/monitoring']);
                break;
            case 'technical_director':
            case 'coach':
                this.router.navigate(['/dashboard']);
                break;
            case 'player':
                this.router.navigate(['/player']);
                break;
            default:
                // Usuario sin rol asignado, redirigir a forbidden o login
                this.router.navigate(['/forbidden']);
                break;
        }
    }
}
