import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { BpDialog } from '../bp-dialog/bp-dialog';
import { RecommenderApiService } from '../../services/recommender.api';
import { GoalSuggestion } from '../../models/recommender';

@Component({
  selector: 'app-goal-suggestions-dialog',
  standalone: true,
  imports: [CommonModule, ButtonModule, BpDialog],
  templateUrl: './goal-suggestions-dialog.html',
})
export class GoalSuggestionsDialog {
  private readonly recommenderApi = inject(RecommenderApiService);

  @Input() visible = false;
  @Input() intensity = 'Media';
  @Input() duration = 90;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() select = new EventEmitter<GoalSuggestion>();

  suggestions: GoalSuggestion[] = [];
  loading = false;
  error: string | null = null;

  onVisibleChange(value: boolean): void {
    this.visible = value;
    this.visibleChange.emit(value);
    if (value && this.suggestions.length === 0 && !this.loading) {
      this.loadSuggestions();
    }
  }

  loadSuggestions(): void {
    this.loading = true;
    this.error = null;

    const intensityMap: Record<string, 'low' | 'medium' | 'high'> = {
      'Baja': 'low',
      'Media': 'medium',
      'Alta': 'high',
    };

    this.recommenderApi
      .suggestGoals({
        context: {
          intensity: intensityMap[this.intensity] ?? 'medium',
          sessionDuration: this.duration,
        },
      })
      .subscribe({
        next: (result) => {
          this.loading = false;
          this.suggestions = result.suggestions ?? [];
        },
        error: (err: Error) => {
          this.loading = false;
          this.error = err.message || 'Error al cargar sugerencias';
        },
      });
  }

  applySuggestion(suggestion: GoalSuggestion): void {
    this.select.emit(suggestion);
    this.close();
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
    if (priority === 'high') return '#22c55e';
    if (priority === 'medium') return '#f59e0b';
    return '#6b7280';
  }

  getPriorityLabel(priority: 'high' | 'medium' | 'low'): string {
    if (priority === 'high') return 'Alta prioridad';
    if (priority === 'medium') return 'Media prioridad';
    return 'Baja prioridad';
  }
}
