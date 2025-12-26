import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  template: `
    <section class="space-y-4">
      <h1 class="text-2xl font-semibold">Dashboard</h1>
      <p class="text-slate-300">Página base (mockup) para acceder a planificación, jugadores y recursos.</p>

      <div class="grid gap-4 md:grid-cols-3">
        <a class="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10" routerLink="/planning/new">
          <div class="font-medium">Nueva planificación</div>
          <div class="text-sm text-slate-300">Generar sesiones individuales o de grupo</div>
        </a>
        <a class="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10" routerLink="/players">
          <div class="font-medium">Jugadores</div>
          <div class="text-sm text-slate-300">Listado y detalle</div>
        </a>
        <a class="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10" routerLink="/exercises">
          <div class="font-medium">Ejercicios</div>
          <div class="text-sm text-slate-300">Catálogo y alta</div>
        </a>
      </div>
    </section>
  `,
  imports: [RouterLink]
})
export class DashboardPage {}
