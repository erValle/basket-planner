import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (message()) {
      <div class="p-3 bg-blue-950/30 border border-blue-800/50 rounded-lg">
        <div class="flex items-start gap-2">
          <i class="pi pi-info-circle text-blue-400 mt-0.5"></i>
          <div class="flex-1">
            @if (title()) {
              <div class="text-[13px] text-blue-200 font-medium mb-1">{{ title() }}</div>
            }
            <div class="text-[12px] text-blue-200" [innerHTML]="message()"></div>
          </div>
          @if (dismissible()) {
            <button 
              type="button" 
              class="text-blue-400 hover:text-blue-300 transition-colors" 
              (click)="onDismiss.emit()"
              aria-label="Cerrar"
            >
              <i class="pi pi-times text-sm"></i>
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: []
})
export class InfoCard {
  title = input<string | null>(null);
  message = input<string | null>(null);
  dismissible = input<boolean>(false);
  onDismiss = output<void>();
}
