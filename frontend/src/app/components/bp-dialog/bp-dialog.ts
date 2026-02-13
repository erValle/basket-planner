import { Component, EventEmitter, Input, Output, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
    selector: 'bp-dialog',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule],
    templateUrl: './bp-dialog.html',
    styleUrl: './bp-dialog.scss',
})
export class BpDialog {
    /** Título del diálogo */
    @Input() header = '';

    /** Subtítulo opcional (aparece debajo del contenido principal) */
    @Input() subtitle = '';

    /** Visibilidad del diálogo (two-way binding) */
    @Input() visible = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    /** Tamaño del diálogo */
    @Input() size: DialogSize = 'md';

    /** Si el diálogo es modal */
    @Input() modal = true;

    /** Si se puede cerrar clickando fuera */
    @Input() dismissableMask = true;

    /** Si se puede arrastrar */
    @Input() draggable = false;

    /** Si está cargando (deshabilita botones) */
    @Input() loading = false;

    /** Texto del botón primario */
    @Input() confirmLabel = 'Confirmar';

    /** Texto del botón secundario */
    @Input() cancelLabel = 'Cancelar';

    /** Si mostrar el botón de confirmar */
    @Input() showConfirm = true;

    /** Si mostrar el botón de cancelar */
    @Input() showCancel = true;

    /** Si el botón de confirmar está deshabilitado */
    @Input() confirmDisabled = false;

    /** Icono del botón primario */
    @Input() confirmIcon = '';

    /** Mensaje de ayuda en el footer (lado izquierdo) */
    @Input() footerHint = '';

    /** Usar footer personalizado */
    @Input() customFooter = false;

    /** Mostrar botón de eliminar */
    @Input() showDelete = false;

    /** Texto del botón de eliminar */
    @Input() deleteLabel = 'Eliminar';

    /** Eventos */
    @Output() confirm = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();
    @Output() closed = new EventEmitter<void>();
    @Output() delete = new EventEmitter<void>();

    /** Template refs para contenido personalizado */
    @ContentChild('dialogContent') contentTemplate?: TemplateRef<unknown>;
    @ContentChild('dialogFooter') footerTemplate?: TemplateRef<unknown>;
    @ContentChild('dialogHeader') headerTemplate?: TemplateRef<unknown>;

    get dialogWidth(): string {
        switch (this.size) {
            case 'sm':
                return '400px';
            case 'md':
                return '560px';
            case 'lg':
                return '720px';
            case 'xl':
                return '900px';
            case 'full':
                return '95vw';
            default:
                return '560px';
        }
    }

    get dialogStyle(): Record<string, string> {
        return {
            width: this.dialogWidth,
            maxWidth: 'calc(100vw - 2rem)',
        };
    }

    onHide(): void {
        this.visibleChange.emit(false);
        this.closed.emit();
    }

    onConfirm(): void {
        if (!this.loading && !this.confirmDisabled) {
            this.confirm.emit();
        }
    }

    onCancel(): void {
        if (!this.loading) {
            this.visibleChange.emit(false);
            this.cancel.emit();
        }
    }

    onDelete(): void {
        if (!this.loading) {
            this.delete.emit();
        }
    }
}
