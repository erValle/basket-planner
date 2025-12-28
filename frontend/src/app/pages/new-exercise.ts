import { Component } from '@angular/core';

/**
 * Legacy route component (kept as a stub).
 * The real create/edit experience is now hosted inside `Exercises` using `ExerciseForm`.
 */
@Component({
  selector: 'app-new-exercise',
  standalone: true,
  template: `<div class="p-6 text-sm text-zinc-300">\n  Esta ruta está en transición. Crea/edita ejercicios desde la pantalla <b>Ejercicios</b>.\n</div>`,
})
export class NewExercise {}
