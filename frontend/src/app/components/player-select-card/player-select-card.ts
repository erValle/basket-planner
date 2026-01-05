import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type PlayerSelectCardModel = {
	id: string;
	name: string;
	position?: string;
	category?: string;
};

@Component({
	selector: 'app-player-select-card',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './player-select-card.html',
})
export class PlayerSelectCard {
	@Input({ required: true }) player!: PlayerSelectCardModel;
	@Input() selected = false;
	@Input() mode: 'single' | 'multi' = 'single';
	@Input() actionLabel = 'Seleccionar';
	@Input() selectedLabel = 'Seleccionado';

	// We keep this as a dumb presentational component on purpose.
	// Parent controls click handling.
}
