import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-error-card',
    standalone: true,
    imports: [CommonModule],
    template: `
        @if (message()) {
            <div class="p-3 bg-red-950/50 border border-red-800 rounded-lg">
                <div class="flex items-start gap-2">
                    <i class="pi pi-exclamation-circle text-red-400 mt-0.5"></i>
                    <div class="flex-1">
                        <div class="text-[13px] text-red-200 font-medium">
                            {{ title() || 'Error' }}
                        </div>
                        <div class="text-[12px] text-red-300 mt-1">{{ message() }}</div>
                    </div>
                    @if (dismissible()) {
                        <button
                            type="button"
                            class="text-red-400 hover:text-red-300 transition-colors"
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
    styles: [],
})
export class ErrorCard {
    title = input<string>('Error');
    message = input<string | null>(null);
    dismissible = input<boolean>(true);
    onDismiss = output<void>();
}
