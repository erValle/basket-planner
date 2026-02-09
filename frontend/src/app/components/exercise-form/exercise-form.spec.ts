import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExerciseForm } from './exercise-form';
import { SliderModule } from 'primeng/slider';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ChipModule } from 'primeng/chip';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ExerciseForm - 4 Difficulty Dimensions', () => {
    let component: ExerciseForm;
    let fixture: ComponentFixture<ExerciseForm>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                ExerciseForm,
                FormsModule,
                ReactiveFormsModule,
                SliderModule,
                AutoCompleteModule,
                ChipModule,
                ButtonModule,
                InputTextModule,
                TextareaModule,
                InputNumberModule,
                SelectModule,
                TagModule,
                HttpClientTestingModule,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ExerciseForm);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('Component Initialization', () => {
        it('should create the component', () => {
            expect(component).toBeTruthy();
        });

        it('should initialize form with 4 difficulty dimensions', () => {
            expect(component.form).toBeDefined();
            expect(component.form.get('dificultadTactica')?.value).toBe(3);
            expect(component.form.get('dificultadTecnica')?.value).toBe(3);
            expect(component.form.get('dificultadFisica')?.value).toBe(3);
            expect(component.form.get('dificultadMental')?.value).toBe(3);
        });

        it('should have basketball-specific exercise types', () => {
            expect(component.tipoOptions.length).toBeGreaterThan(18);
            expect(component.tipoOptions.some((t) => t.value === 'TIRO')).toBe(true);
            expect(component.tipoOptions.some((t) => t.value === 'DEFENSA_INDIVIDUAL')).toBe(true);
        });

        it('should have tag and material suggestions', () => {
            expect(component.etiquetasSugeridas.length).toBeGreaterThan(40);
            expect(component.materialesSugeridos.length).toBeGreaterThan(15);
        });
    });

    describe('Difficulty Dimensions', () => {
        it('should allow setting all 4 difficulty dimensions', () => {
            component.form.patchValue({
                dificultadTactica: 5,
                dificultadTecnica: 1,
                dificultadFisica: 3,
                dificultadMental: 4,
            });

            expect(component.form.get('dificultadTactica')?.value).toBe(5);
            expect(component.form.get('dificultadTecnica')?.value).toBe(1);
            expect(component.form.get('dificultadFisica')?.value).toBe(3);
            expect(component.form.get('dificultadMental')?.value).toBe(4);
        });

        it('should validate difficulty range (1-5)', () => {
            const tacticaControl = component.form.get('dificultadTactica');

            tacticaControl?.setValue(6);
            expect(tacticaControl?.valid).toBe(false);

            tacticaControl?.setValue(3);
            expect(tacticaControl?.valid).toBe(true);
        });
    });

    describe('Tags Management', () => {
        it('should add tag to form', () => {
            component.addTag('shooting');
            expect(component.form.get('etiquetas')?.value).toContain('shooting');
        });

        it('should remove tag from form', () => {
            component.form.patchValue({ etiquetas: ['shooting', 'defense'] });
            component.removeTag('defense');

            const etiquetas = component.form.get('etiquetas')?.value;
            expect(etiquetas).not.toContain('defense');
            expect(etiquetas).toContain('shooting');
        });
    });

    describe('Form Validation', () => {
        it('should require nombre and tipo', () => {
            expect(component.form.get('nombre')?.valid).toBe(false);
            expect(component.form.get('tipo')?.valid).toBe(false);

            component.form.patchValue({
                nombre: 'Test Exercise',
                tipo: 'TIRO',
            });

            expect(component.form.get('nombre')?.valid).toBe(true);
            expect(component.form.get('tipo')?.valid).toBe(true);
        });
    });
});
