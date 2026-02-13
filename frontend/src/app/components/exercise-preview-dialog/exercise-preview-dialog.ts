import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';

import { BpDialog } from '../bp-dialog';
import { ExerciseDto } from '../../services/exercises.api';

@Component({
    selector: 'app-exercise-preview-dialog',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, ChipModule, BpDialog],
    templateUrl: './exercise-preview-dialog.html',
})
export class ExercisePreviewDialog {
    @Input() visible = false;
    @Input() exercise: ExerciseDto | null = null;

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() addExercise = new EventEmitter<ExerciseDto>();

    close(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    onAdd(): void {
        if (this.exercise) {
            this.addExercise.emit(this.exercise);
            this.close();
        }
    }

    getTypeLabel(type: string | undefined): string {
        const labels: Record<string, string> = {
            cardio: 'Cardio',
            strength: 'Fuerza',
            flexibility: 'Flexibilidad',
            balance: 'Equilibrio',
            shooting: 'Tiro',
            passing: 'Pase',
            dribbling: 'Bote',
            defense: 'Defensa',
            warmup: 'Calentamiento',
            cooldown: 'Vuelta a la calma',
        };
        return labels[type || ''] || type || 'General';
    }

    formatDuration(seconds: number | undefined): string {
        if (!seconds) return '—';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0 && secs > 0) return `${mins} min ${secs} seg`;
        if (mins > 0) return `${mins} min`;
        return `${seconds} seg`;
    }

    getDifficultyLabel(key: string): string {
        const labels: Record<string, string> = {
            tactica: 'Táctica',
            tecnica: 'Técnica',
            fisica: 'Física',
            mental: 'Mental',
        };
        return labels[key] || key;
    }

    getDifficultyKeys(): string[] {
        if (!this.exercise?.difficulty || typeof this.exercise.difficulty !== 'object') {
            return [];
        }
        return Object.keys(this.exercise.difficulty);
    }

    getDifficultyValue(key: string): number {
        if (!this.exercise?.difficulty || typeof this.exercise.difficulty !== 'object') {
            return 0;
        }
        return (this.exercise.difficulty as any)[key] || 0;
    }

    calculateAverageDifficulty(): number {
        if (!this.exercise?.difficulty || typeof this.exercise.difficulty !== 'object') {
            return 0;
        }
        const difficulty = this.exercise.difficulty as any;
        const values = [
            difficulty.tactica,
            difficulty.tecnica,
            difficulty.fisica,
            difficulty.mental,
        ].filter((v) => typeof v === 'number');
        if (values.length === 0) return 0;
        const sum = values.reduce((acc, val) => acc + val, 0);
        return Math.round((sum / values.length) * 10) / 10;
    }

    getTagsArray(): string[] {
        if (!this.exercise?.tags) return [];
        if (Array.isArray(this.exercise.tags)) return this.exercise.tags;
        if (typeof this.exercise.tags === 'object') {
            return Object.values(this.exercise.tags)
                .flat()
                .filter((t) => typeof t === 'string');
        }
        return [];
    }
}
