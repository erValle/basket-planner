import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-shell',
    standalone: true,
    imports: [RouterLink, RouterOutlet],
    template: `
        <div class="min-h-screen bg-slate-950 text-slate-100">
            <header
                class="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur"
            >
                <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <a routerLink="/" class="font-semibold tracking-wide">Basket Planner</a>

                    <nav class="flex gap-3 text-sm text-slate-200">
                        <a routerLink="/dashboard" class="hover:text-white">Dashboard</a>
                        <a routerLink="/planning/new" class="hover:text-white">Planning</a>
                        <a routerLink="/players" class="hover:text-white">Players</a>
                        <a routerLink="/monitoring" class="hover:text-white">Monitoring</a>
                        <a routerLink="/exercises" class="hover:text-white">Exercises</a>
                        <a routerLink="/clubs" class="hover:text-white">Clubs</a>
                        <a routerLink="/teams" class="hover:text-white">Teams</a>
                        <a routerLink="/material" class="hover:text-white">Material</a>
                    </nav>
                </div>
            </header>

            <main class="mx-auto max-w-6xl px-4 py-6">
                <router-outlet />
            </main>
        </div>
    `,
})
export class ShellComponent {}
