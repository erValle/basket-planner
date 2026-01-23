
module.exports = {
  // Identificador del modelo
  modelVersion: 'rec-0.1.0-baseline',
  
  // Descripción
  description: 'Modelo de recomendación baseline basado en reglas heurísticas',
  
  // Fecha de creación
  createdAt: '2026-01-05',
  
  // Pesos para el scoring de ejercicios (0-1)
  weights: {
    // Cuánto pesa la coincidencia de etiquetas con los objetivos
    tagMatch: 0.40,
    
    // Cuánto pesa la coincidencia de tipo de ejercicio con el objetivo
    typeMatch: 0.25,
    
    // Cuánto pesa la dificultad apropiada para el nivel del jugador
    difficultyFit: 0.20,
    
    // Cuánto pesa la variedad de tipos de ejercicio en la sesión
    typeVariety: 0.10,
    
    // Cuánto pesa evitar repetir ejercicios en la misma sesión
    uniqueness: 0.05
  },
  
  // Mapeo de objetivos a etiquetas relevantes
  // Incluye tanto claves en inglés como en español para mejor compatibilidad
  goalToTags: {
    // Claves en inglés
    'shooting': ['tiro', 'catch_and_shoot', 'pull_up', 'tiro_libre', 'form_shooting', 'mecanica'],
    'ball_handling': ['bote', 'control', 'mano_dominante', 'mano_no_dominante', 'crossover', 'hesitation'],
    'finishing': ['finalizacion', 'bandeja', 'aro', 'eurostep', 'reverso', 'floater', 'runner'],
    'passing': ['pase', 'pecho', 'picado', 'beisbol', 'skip_pass', 'vision', 'precision'],
    'defense': ['defensa', '1v1', 'closeout', 'lateralidad', 'posicionamiento', 'comunicacion'],
    'pick_and_roll': ['pick_and_roll', 'bloqueo_directo', 'lecturas', 'coberturas'],
    'conditioning': ['fisico', 'anaerobico', 'resistencia', 'condicionamiento', 'intensidad'],
    'tactics': ['tactica', 'spacing', 'cortes', 'ataque', 'lecturas'],
    'rebounding': ['rebote', 'box_out', 'contacto', 'posicion', 'segunda_oportunidad'],
    'post_play': ['poste', 'footwork', 'drop_step', 'up_and_under', 'spin_move'],
    'transition': ['transicion', 'contraataque', 'carriles', 'velocidad'],
    'fundamentals': ['fundamentos', 'mecanica', 'repeticion', 'control'],
    // Claves en español (alias)
    'tiro': ['tiro', 'catch_and_shoot', 'pull_up', 'tiro_libre', 'form_shooting', 'mecanica'],
    'bote': ['bote', 'control', 'mano_dominante', 'mano_no_dominante', 'crossover', 'hesitation'],
    'manejo': ['bote', 'control', 'mano_dominante', 'mano_no_dominante', 'crossover', 'hesitation'],
    'finalizacion': ['finalizacion', 'bandeja', 'aro', 'eurostep', 'reverso', 'floater', 'runner'],
    'pase': ['pase', 'pecho', 'picado', 'beisbol', 'skip_pass', 'vision', 'precision'],
    'defensa': ['defensa', '1v1', 'closeout', 'lateralidad', 'posicionamiento', 'comunicacion'],
    'bloqueo': ['pick_and_roll', 'bloqueo_directo', 'lecturas', 'coberturas'],
    'fisico': ['fisico', 'anaerobico', 'resistencia', 'condicionamiento', 'intensidad'],
    'condicionamiento': ['fisico', 'anaerobico', 'resistencia', 'condicionamiento', 'intensidad'],
    'tactica': ['tactica', 'spacing', 'cortes', 'ataque', 'lecturas'],
    'rebote': ['rebote', 'box_out', 'contacto', 'posicion', 'segunda_oportunidad'],
    'poste': ['poste', 'footwork', 'drop_step', 'up_and_under', 'spin_move'],
    'transicion': ['transicion', 'contraataque', 'carriles', 'velocidad'],
    'contraataque': ['transicion', 'contraataque', 'carriles', 'velocidad']
  },
  
  // Mapeo de objetivos a tipos de ejercicio preferidos
  // Incluye tanto claves en inglés como en español para mejor compatibilidad
  goalToTypes: {
    // Claves en inglés
    'shooting': ['TIRO'],
    'ball_handling': ['TECNICA_BOTE'],
    'finishing': ['FINALIZACION_ARO'],
    'passing': ['PASE'],
    'defense': ['DEFENSA_INDIVIDUAL', 'DEFENSA_EQUIPO', 'DEFENSA_FUNDAMENTOS'],
    'pick_and_roll': ['TACTICA_ATAQUE', 'TACTICA_ATAQUE_DEFENSA'],
    'conditioning': ['CONDICIONAMIENTO_FISICO'],
    'tactics': ['TACTICA_ATAQUE', 'TACTICA_ATAQUE_DEFENSA', 'TACTICA_TRANSICION'],
    'rebounding': ['REBOTE'],
    'post_play': ['TECNICA_POSTE'],
    'transition': ['TACTICA_TRANSICION'],
    'fundamentals': ['TECNICA_BOTE', 'TECNICA_PIES', 'PASE'],
    // Claves en español
    'tiro': ['TIRO'],
    'bote': ['TECNICA_BOTE'],
    'manejo': ['TECNICA_BOTE'],
    'finalizacion': ['FINALIZACION_ARO'],
    'pase': ['PASE'],
    'defensa': ['DEFENSA_INDIVIDUAL', 'DEFENSA_EQUIPO', 'DEFENSA_FUNDAMENTOS'],
    'bloqueo': ['TACTICA_ATAQUE', 'TACTICA_ATAQUE_DEFENSA'],
    'fisico': ['CONDICIONAMIENTO_FISICO'],
    'condicionamiento': ['CONDICIONAMIENTO_FISICO'],
    'tactica': ['TACTICA_ATAQUE', 'TACTICA_ATAQUE_DEFENSA', 'TACTICA_TRANSICION'],
    'rebote': ['REBOTE'],
    'poste': ['TECNICA_POSTE'],
    'transicion': ['TACTICA_TRANSICION'],
    'contraataque': ['TACTICA_TRANSICION']
  },
  
  // Distribución de tiempo recomendada tipos de ejercicio por sesión
  sessionTypeDistribution: {
    warmup: 0.15,        // 15% calentamiento/movilidad
    technical: 0.35,     // 35% técnica individual
    tactical: 0.30,      // 30% táctica/juego
    conditioning: 0.15,  // 15% condicionamiento
    recovery: 0.05       // 5% vuelta a la calma
  },
  
  // Tipos de ejercicio considerados para cada fase de la sesión
  sessionPhaseTypes: {
    warmup: ['MOVILIDAD_RECUPERACION', 'TECNICA_BOTE', 'PASE'],
    technical: [
      'TECNICA_BOTE', 
      'TECNICA_PIES', 
      'TIRO', 
      'FINALIZACION_ARO', 
      'TECNICA_POSTE',
      'PASE',
      'ATAQUE_INDIVIDUAL'
    ],
    tactical: [
      'TACTICA_ATAQUE', 
      'TACTICA_ATAQUE_DEFENSA', 
      'TACTICA_TRANSICION',
      'DEFENSA_INDIVIDUAL',
      'DEFENSA_EQUIPO',
      'JUEGO_REDUCIDO',
      'REBOTE'
    ],
    conditioning: [
      'CONDICIONAMIENTO_FISICO',
      'TACTICA_TRANSICION',
      'JUEGO_REDUCIDO'
    ],
    recovery: ['MOVILIDAD_RECUPERACION']
  },
  
  // Mapeo de nivel de jugador a rango de dificultad aceptable
  levelToDifficulty: {
    beginner: { min: 1, max: 3 },
    intermediate: { min: 2, max: 4 },
    advanced: { min: 3, max: 5 }
  },
  
  // Mapeo de intensidad a multiplicador de dificultad
  intensityMultiplier: {
    low: 0.8,
    medium: 1.0,
    high: 1.2
  },
  
  // Ponderación de dimensiones de dificultad según el objetivo de la sesión
  // Cada objetivo tiene pesos para: táctica, técnica, física, mental (suman 1.0)
  // Incluye tanto claves en inglés como en español para mejor compatibilidad
  objectiveToDimensionWeights: {
    // Claves en inglés
    'shooting': { tactica: 0.1, tecnica: 0.5, fisica: 0.2, mental: 0.2 },
    'ball_handling': { tactica: 0.1, tecnica: 0.6, fisica: 0.2, mental: 0.1 },
    'finishing': { tactica: 0.15, tecnica: 0.5, fisica: 0.25, mental: 0.1 },
    'passing': { tactica: 0.2, tecnica: 0.4, fisica: 0.1, mental: 0.3 },
    'defense': { tactica: 0.25, tecnica: 0.25, fisica: 0.3, mental: 0.2 },
    'pick_and_roll': { tactica: 0.5, tecnica: 0.2, fisica: 0.15, mental: 0.15 },
    'conditioning': { tactica: 0.05, tecnica: 0.1, fisica: 0.7, mental: 0.15 },
    'tactics': { tactica: 0.6, tecnica: 0.15, fisica: 0.1, mental: 0.15 },
    'rebounding': { tactica: 0.2, tecnica: 0.2, fisica: 0.4, mental: 0.2 },
    'post_play': { tactica: 0.25, tecnica: 0.45, fisica: 0.2, mental: 0.1 },
    'transition': { tactica: 0.3, tecnica: 0.2, fisica: 0.35, mental: 0.15 },
    'fundamentals': { tactica: 0.1, tecnica: 0.5, fisica: 0.2, mental: 0.2 },
    // Claves en español
    'tiro': { tactica: 0.1, tecnica: 0.5, fisica: 0.2, mental: 0.2 },
    'bote': { tactica: 0.1, tecnica: 0.6, fisica: 0.2, mental: 0.1 },
    'manejo': { tactica: 0.1, tecnica: 0.6, fisica: 0.2, mental: 0.1 },
    'finalizacion': { tactica: 0.15, tecnica: 0.5, fisica: 0.25, mental: 0.1 },
    'pase': { tactica: 0.2, tecnica: 0.4, fisica: 0.1, mental: 0.3 },
    'defensa': { tactica: 0.25, tecnica: 0.25, fisica: 0.3, mental: 0.2 },
    'bloqueo': { tactica: 0.5, tecnica: 0.2, fisica: 0.15, mental: 0.15 },
    'fisico': { tactica: 0.05, tecnica: 0.1, fisica: 0.7, mental: 0.15 },
    'condicionamiento': { tactica: 0.05, tecnica: 0.1, fisica: 0.7, mental: 0.15 },
    'tactica': { tactica: 0.6, tecnica: 0.15, fisica: 0.1, mental: 0.15 },
    'rebote': { tactica: 0.2, tecnica: 0.2, fisica: 0.4, mental: 0.2 },
    'poste': { tactica: 0.25, tecnica: 0.45, fisica: 0.2, mental: 0.1 },
    'transicion': { tactica: 0.3, tecnica: 0.2, fisica: 0.35, mental: 0.15 },
    'contraataque': { tactica: 0.3, tecnica: 0.2, fisica: 0.35, mental: 0.15 },
    // Peso por defecto si no hay objetivo específico
    'default': { tactica: 0.25, tecnica: 0.25, fisica: 0.25, mental: 0.25 }
  },
  
  // Mapeo de materiales del JSON a términos normalizados
  materialNormalization: {
    'balon': ['ball', 'balon', 'balón'],
    'canasta': ['basket', 'canasta', 'hoop', 'aro'],
    'conos': ['cones', 'conos'],
    '2_balones': ['2_balls', '2_balones', 'dos_balones'],
    'foam_pad': ['foam', 'foam_pad', 'colchoneta'],
    'banda_elastica': ['banda', 'banda_elastica', 'resistance_band'],
    'cajon_pliometria': ['box', 'cajon', 'cajón', 'plyometric_box'],
    'foam_roller': ['roller', 'foam_roller'],
    'petos': ['petos', 'bibs', 'jerseys'],
    'pizarra_tactica': ['pizarra', 'whiteboard', 'tactical_board'],
    'rebotador_o_companero': ['rebotador', 'partner', 'compañero'],
    'cronometro_o_app': ['timer', 'cronometro', 'cronómetro', 'app'],
    'silbato_o_app_senal': ['whistle', 'silbato', 'señal'],
    'tarjetas_colores': ['tarjetas', 'cards', 'color_cards']
  },
  
  // Configuración de variedad: mínimo de ejercicios diferentes por sesión
  minExerciseVariety: 4,
  
  // Configuración de variedad: máximo de repeticiones del mismo ejercicio
  maxExerciseRepetitions: 1
};
