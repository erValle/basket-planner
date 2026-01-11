/**
 * Constantes y opciones utilizadas en la creación y edición de planificaciones
 */

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

/**
 * Opciones de objetivos para planificaciones de baloncesto
 */
export const OBJECTIVE_OPTIONS: SelectOption[] = [
  // Separador - Ataque
  { label: '─── ATAQUE ───', value: '', disabled: true },
  { label: 'Mejora del tiro exterior', value: 'Mejora del tiro exterior' },
  { label: 'Tiro en suspensión', value: 'Tiro en suspensión' },
  { label: 'Tiros libres', value: 'Tiros libres' },
  { label: 'Manejo de balón', value: 'Manejo de balón' },
  { label: 'Pases y asistencias', value: 'Pases y asistencias' },
  { label: 'Juego de pies ofensivo', value: 'Juego de pies ofensivo' },
  { label: 'Penetraciones y finalizaciones', value: 'Penetraciones y finalizaciones' },
  { label: 'Juego en el poste bajo', value: 'Juego en el poste bajo' },
  { label: 'Ataque individual (1v1)', value: 'Ataque individual (1v1)' },

  // Separador - Defensa
  { label: '─── DEFENSA ───', value: '', disabled: true },
  { label: 'Defensa individual', value: 'Defensa individual' },
  { label: 'Defensa de perímetro', value: 'Defensa de perímetro' },
  { label: 'Sistemas defensivos en equipo', value: 'Sistemas defensivos en equipo' },
  { label: 'Fundamentos defensivos', value: 'Fundamentos defensivos' },

  // Separador - Rebote
  { label: '─── REBOTE ───', value: '', disabled: true },
  { label: 'Rebote defensivo', value: 'Rebote defensivo' },
  { label: 'Rebote ofensivo', value: 'Rebote ofensivo' },

  // Separador - Física
  { label: '─── FÍSICA ───', value: '', disabled: true },
  { label: 'Condición física general', value: 'Condición física general' },
  { label: 'Velocidad y agilidad', value: 'Velocidad y agilidad' },
  { label: 'Movilidad y recuperación', value: 'Movilidad y recuperación' },

  // Separador - Táctica
  { label: '─── TÁCTICA ───', value: '', disabled: true },
  { label: 'Transiciones ofensivas', value: 'Transiciones ofensivas' },
  { label: 'Transiciones defensivas', value: 'Transiciones defensivas' },
  { label: 'Juego colectivo ofensivo', value: 'Juego colectivo ofensivo' },
  { label: 'Bloqueos directos (Pick & Roll)', value: 'Bloqueos directos (Pick & Roll)' },
  { label: 'Espacios y movimiento sin balón', value: 'Espacios y movimiento sin balón' },
  { label: 'ABP y saques', value: 'ABP y saques' },
  { label: 'Situaciones de juego reducido', value: 'Situaciones de juego reducido' },

  // Separador - Mental
  { label: '─── MENTAL ───', value: '', disabled: true },
  { label: 'Concentración y toma de decisiones', value: 'Concentración y toma de decisiones' },
  { label: 'Lectura del juego', value: 'Lectura del juego' },
];

/**
 * Opciones de intensidad para sesiones de entrenamiento
 */
export const INTENSITY_OPTIONS: SelectOption[] = [
  { label: 'Baja', value: 'Baja' },
  { label: 'Media', value: 'Media' },
  { label: 'Alta', value: 'Alta' },
];

/**
 * Opciones de posición de jugador
 */
export const POSITION_OPTIONS: SelectOption[] = [
  { label: 'Base', value: 'base' },
  { label: 'Escolta', value: 'escolta' },
  { label: 'Alero', value: 'alero' },
  { label: 'Ala-pívot', value: 'ala-pivot' },
  { label: 'Pívot', value: 'pivot' },
];

/**
 * Opciones de categoría de jugador
 */
export const CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'Senior', value: 'senior' },
  { label: 'Juvenil', value: 'juvenil' },
  { label: 'Infantil', value: 'infantil' },
];

/**
 * Opciones de modo de planificación
 */
export const PLANNING_MODE_OPTIONS: SelectOption[] = [
  { label: 'Individual', value: 'individual' },
  { label: 'Grupal', value: 'group' },
];

/**
 * Pasos del wizard de nueva planificación
 */
export const NEW_PLANNING_STEPS = [
  { number: 1, label: 'Datos básicos' },
  { number: 2, label: 'Destino' },
  { number: 3, label: 'Restricciones' },
  { number: 4, label: 'Revisión' },
] as const;

/**
 * Valores por defecto del formulario de planificación
 */
export const DEFAULT_PLANNING_FORM = {
  name: '',
  duration: 90, // Duración por sesión en minutos
  sessionsCount: 4, // Número de sesiones
  summary: '',
  objective: 'Mejora del tiro exterior' as string,
  intensity: 'Media' as string,
};
