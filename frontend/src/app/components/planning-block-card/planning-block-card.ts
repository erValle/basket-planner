import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

import {
    PlanningExerciseCard,
    PlanningExercise,
} from '../planning-exercise-card/planning-exercise-card';

export interface PlanningBlock {
    id: string;
    name: string;
    durationMin: number;
    notes: string;
    exercises: PlanningExercise[];
}

type Option = { label: string; value: string };

@Component({
    selector: 'app-planning-block-card',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        TooltipModule,
        PlanningExerciseCard,
    ],
    templateUrl: './planning-block-card.html',
})
export class PlanningBlockCard {
    @Input({ required: true }) block!: PlanningBlock;
    @Input() blockIndex = 0;
    @Input() isFirst = false;
    @Input() isLast = false;
    @Input() materialOptions: Option[] = [];
    @Input() intensityOptions: Option[] = [];

    @Output() remove = new EventEmitter<string>();
    @Output() moveUp = new EventEmitter<string>();
    @Output() moveDown = new EventEmitter<string>();
    @Output() addExercise = new EventEmitter<void>();
    @Output() searchExercise = new EventEmitter<void>();
    @Output() removeExercise = new EventEmitter<string>();
    @Output() moveExerciseUp = new EventEmitter<string>();
    @Output() moveExerciseDown = new EventEmitter<string>();
    @Output() previewExercise = new EventEmitter<PlanningExercise>();
    @Output() change = new EventEmitter<PlanningBlock>();

    // Validation
    touched = new Set<string>();

    markTouched(key: string): void {
        this.touched.add(key);
    }

    hasError(key: string, valid: boolean): boolean {
        return this.touched.has(key) && !valid;
    }

    onRemove(): void {
        this.remove.emit(this.block.id);
    }

    onMoveUp(): void {
        this.moveUp.emit(this.block.id);
    }

    onMoveDown(): void {
        this.moveDown.emit(this.block.id);
    }

    onAddExercise(): void {
        this.addExercise.emit();
    }

    onSearchExercise(): void {
        this.searchExercise.emit();
    }

    onRemoveExercise(exerciseId: string): void {
        this.removeExercise.emit(exerciseId);
    }

    onMoveExerciseUp(exerciseId: string): void {
        this.moveExerciseUp.emit(exerciseId);
    }

    onMoveExerciseDown(exerciseId: string): void {
        this.moveExerciseDown.emit(exerciseId);
    }

    onPreviewExercise(exercise: PlanningExercise): void {
        this.previewExercise.emit(exercise);
    }

    onExerciseChange(): void {
        this.change.emit(this.block);
    }

    emitChange(): void {
        this.change.emit(this.block);
    }
}
