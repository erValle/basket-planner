/**
 * Configuración del Motor de Recomendación TFRS
 *
 * Este modelo utiliza TensorFlow.js para implementar un sistema de ranking
 * basado en embeddings que aprende de las interacciones históricas.
 *
 * Versión: 1.0.0
 */

module.exports = {
  // IDENTIFICACIÓN DEL MODELO
  modelVersion: '1.0.0-tfrs',
  description: 'Motor de recomendación con TensorFlow Recommenders y sistema híbrido',
  createdAt: '2026-01-23',

  // ARQUITECTURA DE LA RED NEURONAL
  architecture: {
    // Dimensión de los embeddings (representación vectorial)
    embeddingDim: 32,

    // Capas ocultas de la torre de usuario/contexto
    userTowerLayers: [64, 32],

    // Capas ocultas de la torre de ejercicios
    exerciseTowerLayers: [64, 32],

    // Capas de la red de ranking final
    rankingLayers: [64, 32, 16],

    // Función de activación
    activation: 'relu',

    // Dropout para regularización
    dropoutRate: 0.2,

    // L2 regularization
    l2Regularization: 0.001,
  },

  // CONFIGURACIÓN DE ENTRENAMIENTO
  training: {
    // Tasa de aprendizaje
    learningRate: 0.001,

    // Tamaño del batch
    batchSize: 32,

    // Número máximo de épocas
    epochs: 50,

    // Early stopping - paciencia
    earlyStoppingPatience: 5,

    // Porcentaje de datos para validación
    validationSplit: 0.2,

    // Optimizador
    optimizer: 'adam',

    // Pérdida para el modelo de ranking
    loss: 'meanSquaredError',
  },

  // VALORES POR DEFECTO PARA GENERACIÓN DE PLANIFICACIONES
  defaults: {
    // Número de ejercicios por sesión si no se especifica
    targetExerciseCount: 12,

    // Duración de sesión en minutos si no se especifica (igual que el formulario de creación)
    sessionDurationMinutes: 90,

    // Intensidad por defecto
    intensity: 'medium',

    // Fase de sesión por defecto
    sessionPhase: 'technical',

    // Posición por defecto
    position: 'unknown',
  },

  // VOCABULARIOS Y ENCODINGS
  vocabularies: {
    // Intensidades
    intensities: ['low', 'medium', 'high'],

    // Posiciones de jugador
    positions: ['base', 'escolta', 'alero', 'ala-pivot', 'pivot', 'unknown'],

    // Fases de sesión
    sessionPhases: ['warmup', 'technical', 'tactical', 'conditioning', 'recovery'],

    // Tipos de ejercicio
    exerciseTypes: [
      'MOVILIDAD_RECUPERACION',
      'TECNICA_BOTE',
      'TECNICA_PIES',
      'TIRO',
      'FINALIZACION_ARO',
      'TECNICA_POSTE',
      'PASE',
      'ATAQUE_INDIVIDUAL',
      'TACTICA_ATAQUE',
      'TACTICA_ATAQUE_DEFENSA',
      'TACTICA_TRANSICION',
      'DEFENSA_INDIVIDUAL',
      'DEFENSA_EQUIPO',
      'DEFENSA_FUNDAMENTOS',
      'JUEGO_REDUCIDO',
      'REBOTE',
      'CONDICIONAMIENTO_FISICO',
    ],

    // Objetivos de entrenamiento
    goals: [
      'shooting',
      'ball_handling',
      'finishing',
      'passing',
      'defense',
      'pick_and_roll',
      'conditioning',
      'tactics',
      'rebounding',
      'post_play',
      'transition',
      'fundamentals',
      'tiro',
      'bote',
      'manejo',
      'finalizacion',
      'pase',
      'defensa',
      'bloqueo',
      'fisico',
      'condicionamiento',
      'tactica',
      'rebote',
      'poste',
      'transicion',
      'contraataque',
    ],
  },

  // FEATURES DEL CONTEXTO (Usuario/Sesión)
  contextFeatures: {
    categorical: ['intensity', 'sessionPhase', 'position'],
    numerical: [
      'sessionDurationMinutes',
      'currentSessionMinutes',
      'remainingMinutes',
      'exercisesInSession',
      'typesUsedCount',
      'targetExerciseCount',
    ],
    goals: 'goals',
  },

  // FEATURES DEL EJERCICIO (Item)
  exerciseFeatures: {
    categorical: ['type', 'exerciseId'],
    numerical: [
      'durationMinutes',
      'difficultyTactica',
      'difficultyTecnica',
      'difficultyFisica',
      'difficultyMental',
    ],
    tags: 'tags',
  },

  // PESOS DEL SISTEMA DE SCORING
  weights: {
    // Peso del modelo neuronal vs reglas heurísticas
    neuralWeight: 0.7,
    heuristicWeight: 0.3,

    // Pesos heurísticos para scoring (deben sumar 1.0)
    // Basado en documentación pero manteniendo sessionPhaseFit por funcionalidad
    tagMatch: 0.3, // Coincidencia de etiquetas con objetivos
    typeMatch: 0.2, // Coincidencia de tipo con objetivos
    difficultyFit: 0.15, // Ajuste a nivel/intensidad del jugador
    sessionPhaseFit: 0.2, // Ajuste al fase de sesión (warmup, technical, etc.)
    typeVariety: 0.1, // Variedad de tipos en la sesión
    uniqueness: 0.05, // Penalización por ejercicios repetidos
    // Total: 0.30 + 0.20 + 0.15 + 0.20 + 0.10 + 0.05 = 1.0
  },

  // MAPEOS DE OBJETIVOS

  // Mapeo de objetivos a etiquetas relevantes
  goalToTags: {
    shooting: ['tiro', 'catch_and_shoot', 'pull_up', 'tiro_libre', 'form_shooting', 'mecanica'],
    ball_handling: [
      'bote',
      'control',
      'mano_dominante',
      'mano_no_dominante',
      'crossover',
      'hesitation',
    ],
    finishing: ['finalizacion', 'bandeja', 'aro', 'eurostep', 'reverso', 'floater', 'runner'],
    passing: ['pase', 'pecho', 'picado', 'beisbol', 'skip_pass', 'vision', 'precision'],
    defense: ['defensa', '1v1', 'closeout', 'lateralidad', 'posicionamiento', 'comunicacion'],
    pick_and_roll: ['pick_and_roll', 'bloqueo_directo', 'lecturas', 'coberturas'],
    conditioning: ['fisico', 'anaerobico', 'resistencia', 'condicionamiento', 'intensidad'],
    tactics: ['tactica', 'spacing', 'cortes', 'ataque', 'lecturas'],
    rebounding: ['rebote', 'box_out', 'contacto', 'posicion', 'segunda_oportunidad'],
    post_play: ['poste', 'footwork', 'drop_step', 'up_and_under', 'spin_move'],
    transition: ['transicion', 'contraataque', 'carriles', 'velocidad'],
    fundamentals: ['fundamentos', 'mecanica', 'repeticion', 'control'],
    tiro: ['tiro', 'catch_and_shoot', 'pull_up', 'tiro_libre', 'form_shooting', 'mecanica'],
    bote: ['bote', 'control', 'mano_dominante', 'mano_no_dominante', 'crossover', 'hesitation'],
    manejo: ['bote', 'control', 'mano_dominante', 'mano_no_dominante', 'crossover', 'hesitation'],
    finalizacion: ['finalizacion', 'bandeja', 'aro', 'eurostep', 'reverso', 'floater', 'runner'],
    pase: ['pase', 'pecho', 'picado', 'beisbol', 'skip_pass', 'vision', 'precision'],
    defensa: ['defensa', '1v1', 'closeout', 'lateralidad', 'posicionamiento', 'comunicacion'],
    bloqueo: ['pick_and_roll', 'bloqueo_directo', 'lecturas', 'coberturas'],
    fisico: ['fisico', 'anaerobico', 'resistencia', 'condicionamiento', 'intensidad'],
    condicionamiento: ['fisico', 'anaerobico', 'resistencia', 'condicionamiento', 'intensidad'],
    tactica: ['tactica', 'spacing', 'cortes', 'ataque', 'lecturas'],
    rebote: ['rebote', 'box_out', 'contacto', 'posicion', 'segunda_oportunidad'],
    poste: ['poste', 'footwork', 'drop_step', 'up_and_under', 'spin_move'],
    transicion: ['transicion', 'contraataque', 'carriles', 'velocidad'],
    contraataque: ['transicion', 'contraataque', 'carriles', 'velocidad'],
  },

  // Mapeo de objetivos a tipos de ejercicio preferidos
  goalToTypes: {
    shooting: ['TIRO'],
    ball_handling: ['TECNICA_BOTE'],
    finishing: ['FINALIZACION_ARO'],
    passing: ['PASE'],
    defense: ['DEFENSA_INDIVIDUAL', 'DEFENSA_EQUIPO', 'DEFENSA_FUNDAMENTOS'],
    pick_and_roll: ['TACTICA_ATAQUE', 'TACTICA_ATAQUE_DEFENSA'],
    conditioning: ['CONDICIONAMIENTO_FISICO'],
    tactics: ['TACTICA_ATAQUE', 'TACTICA_ATAQUE_DEFENSA', 'TACTICA_TRANSICION'],
    rebounding: ['REBOTE'],
    post_play: ['TECNICA_POSTE'],
    transition: ['TACTICA_TRANSICION'],
    fundamentals: ['TECNICA_BOTE', 'TECNICA_PIES', 'PASE'],
    tiro: ['TIRO'],
    bote: ['TECNICA_BOTE'],
    manejo: ['TECNICA_BOTE'],
    finalizacion: ['FINALIZACION_ARO'],
    pase: ['PASE'],
    defensa: ['DEFENSA_INDIVIDUAL', 'DEFENSA_EQUIPO', 'DEFENSA_FUNDAMENTOS'],
    bloqueo: ['TACTICA_ATAQUE', 'TACTICA_ATAQUE_DEFENSA'],
    fisico: ['CONDICIONAMIENTO_FISICO'],
    condicionamiento: ['CONDICIONAMIENTO_FISICO'],
    tactica: ['TACTICA_ATAQUE', 'TACTICA_ATAQUE_DEFENSA', 'TACTICA_TRANSICION'],
    rebote: ['REBOTE'],
    poste: ['TECNICA_POSTE'],
    transicion: ['TACTICA_TRANSICION'],
    contraataque: ['TACTICA_TRANSICION'],
  },

  // Distribución de tiempo por fase
  sessionTypeDistribution: {
    warmup: 0.15,
    technical: 0.35,
    tactical: 0.3,
    conditioning: 0.15,
    recovery: 0.05,
  },

  // Tipos por fase de sesión
  sessionPhaseTypes: {
    warmup: ['MOVILIDAD_RECUPERACION', 'TECNICA_BOTE', 'PASE'],
    technical: [
      'TECNICA_BOTE',
      'TECNICA_PIES',
      'TIRO',
      'FINALIZACION_ARO',
      'TECNICA_POSTE',
      'PASE',
      'ATAQUE_INDIVIDUAL',
      'DEFENSA_FUNDAMENTOS',
    ],
    tactical: [
      'TACTICA_ATAQUE',
      'TACTICA_ATAQUE_DEFENSA',
      'TACTICA_TRANSICION',
      'DEFENSA_INDIVIDUAL',
      'DEFENSA_EQUIPO',
      'JUEGO_REDUCIDO',
      'REBOTE',
    ],
    conditioning: ['CONDICIONAMIENTO_FISICO', 'TACTICA_TRANSICION', 'JUEGO_REDUCIDO'],
    recovery: ['MOVILIDAD_RECUPERACION'],
  },

  // Rangos de dificultad por nivel de jugador (documentado en FLUJOS_Y_VERIFICACIONES.md)
  levelToDifficulty: {
    beginner: { min: 1.0, max: 3.0 },
    intermediate: { min: 2.0, max: 4.0 },
    advanced: { min: 3.0, max: 5.0 },
  },

  // Rangos de dificultad por intensidad
  // (baja, media, alta)
  intensityToDifficulty: {
    low: { min: 1, max: 3 },
    medium: { min: 2, max: 4 },
    high: { min: 3, max: 5 },
  },

  // Deprecated
  // Multiplicadores de intensidad
  intensityMultiplier: {
    low: 0.8,
    medium: 1.0,
    high: 1.2,
  },

  // Pesos de dimensiones por objetivo
  objectiveToDimensionWeights: {
    shooting: { tactica: 0.1, tecnica: 0.5, fisica: 0.2, mental: 0.2 },
    ball_handling: { tactica: 0.1, tecnica: 0.6, fisica: 0.2, mental: 0.1 },
    finishing: { tactica: 0.15, tecnica: 0.5, fisica: 0.25, mental: 0.1 },
    passing: { tactica: 0.2, tecnica: 0.4, fisica: 0.1, mental: 0.3 },
    defense: { tactica: 0.25, tecnica: 0.25, fisica: 0.3, mental: 0.2 },
    pick_and_roll: { tactica: 0.5, tecnica: 0.2, fisica: 0.15, mental: 0.15 },
    conditioning: { tactica: 0.05, tecnica: 0.1, fisica: 0.7, mental: 0.15 },
    tactics: { tactica: 0.6, tecnica: 0.15, fisica: 0.1, mental: 0.15 },
    rebounding: { tactica: 0.2, tecnica: 0.2, fisica: 0.4, mental: 0.2 },
    post_play: { tactica: 0.25, tecnica: 0.45, fisica: 0.2, mental: 0.1 },
    transition: { tactica: 0.3, tecnica: 0.2, fisica: 0.35, mental: 0.15 },
    fundamentals: { tactica: 0.1, tecnica: 0.5, fisica: 0.2, mental: 0.2 },
    tiro: { tactica: 0.1, tecnica: 0.5, fisica: 0.2, mental: 0.2 },
    bote: { tactica: 0.1, tecnica: 0.6, fisica: 0.2, mental: 0.1 },
    manejo: { tactica: 0.1, tecnica: 0.6, fisica: 0.2, mental: 0.1 },
    finalizacion: { tactica: 0.15, tecnica: 0.5, fisica: 0.25, mental: 0.1 },
    pase: { tactica: 0.2, tecnica: 0.4, fisica: 0.1, mental: 0.3 },
    defensa: { tactica: 0.25, tecnica: 0.25, fisica: 0.3, mental: 0.2 },
    bloqueo: { tactica: 0.5, tecnica: 0.2, fisica: 0.15, mental: 0.15 },
    fisico: { tactica: 0.05, tecnica: 0.1, fisica: 0.7, mental: 0.15 },
    condicionamiento: { tactica: 0.05, tecnica: 0.1, fisica: 0.7, mental: 0.15 },
    tactica: { tactica: 0.6, tecnica: 0.15, fisica: 0.1, mental: 0.15 },
    rebote: { tactica: 0.2, tecnica: 0.2, fisica: 0.4, mental: 0.2 },
    poste: { tactica: 0.25, tecnica: 0.45, fisica: 0.2, mental: 0.1 },
    transicion: { tactica: 0.3, tecnica: 0.2, fisica: 0.35, mental: 0.15 },
    contraataque: { tactica: 0.3, tecnica: 0.2, fisica: 0.35, mental: 0.15 },
    default: { tactica: 0.25, tecnica: 0.25, fisica: 0.25, mental: 0.25 },
  },

  // Normalización de materiales
  materialNormalization: {
    balon: ['ball', 'balon', 'balón'],
    canasta: ['basket', 'canasta', 'hoop', 'aro'],
    conos: ['cones', 'conos'],
    '2_balones': ['2_balls', '2_balones', 'dos_balones'],
    foam_pad: ['foam', 'foam_pad', 'colchoneta'],
    banda_elastica: ['banda', 'banda_elastica', 'resistance_band'],
    cajon_pliometria: ['box', 'cajon', 'cajón', 'plyometric_box'],
    foam_roller: ['roller', 'foam_roller'],
    petos: ['petos', 'bibs', 'jerseys'],
    pizarra_tactica: ['pizarra', 'whiteboard', 'tactical_board'],
    rebotador_o_companero: ['rebotador', 'partner', 'compañero'],
    cronometro_o_app: ['timer', 'cronometro', 'cronómetro', 'app'],
    silbato_o_app_senal: ['whistle', 'silbato', 'señal'],
    tarjetas_colores: ['tarjetas', 'cards', 'color_cards'],
  },

  // MAPEO DE OBJETIVOS DEL FRONTEND A GOALS DEL MODELO
  // Este mapeo convierte los textos de OBJECTIVE_OPTIONS del frontend
  // a los goals reconocidos por el modelo de recomendación.
  // Cada objetivo del frontend puede mapear a uno o varios goals del modelo.
  frontendObjectiveToGoals: {
    // --- ATAQUE ---
    'Mejora del tiro exterior': ['shooting', 'tiro'],
    'Tiro en suspensión': ['shooting', 'tiro'],
    'Tiros libres': ['shooting', 'tiro'],
    'Manejo de balón': ['ball_handling', 'bote', 'manejo'],
    'Pases y asistencias': ['passing', 'pase'],
    'Juego de pies ofensivo': ['fundamentals', 'finalizacion'],
    'Penetraciones y finalizaciones': ['finishing', 'finalizacion'],
    'Juego en el poste bajo': ['post_play', 'poste'],
    'Ataque individual (1v1)': ['ball_handling', 'finishing', 'bote', 'finalizacion'],

    // --- DEFENSA ---
    'Defensa individual': ['defense', 'defensa'],
    'Defensa de perímetro': ['defense', 'defensa'],
    'Sistemas defensivos en equipo': ['defense', 'tactics', 'defensa', 'tactica'],
    'Fundamentos defensivos': ['defense', 'fundamentals', 'defensa'],

    // --- REBOTE ---
    'Rebote defensivo': ['rebounding', 'rebote'],
    'Rebote ofensivo': ['rebounding', 'rebote'],

    // --- FÍSICA ---
    'Condición física general': ['conditioning', 'fisico', 'condicionamiento'],
    'Velocidad y agilidad': ['conditioning', 'fisico', 'transition'],
    'Movilidad y recuperación': ['conditioning', 'fundamentals'],

    // --- TÁCTICA ---
    'Transiciones ofensivas': ['transition', 'transicion', 'contraataque'],
    'Transiciones defensivas': ['transition', 'defense', 'transicion', 'defensa'],
    'Juego colectivo ofensivo': ['tactics', 'passing', 'tactica', 'pase'],
    'Bloqueos directos (Pick & Roll)': ['pick_and_roll', 'tactics', 'bloqueo', 'tactica'],
    'Espacios y movimiento sin balón': ['tactics', 'fundamentals', 'tactica'],
    'ABP y saques': ['tactics', 'tactica'],
    'Situaciones de juego reducido': ['tactics', 'tactica'],

    // --- MENTAL ---
    'Concentración y toma de decisiones': ['tactics', 'fundamentals', 'tactica'],
    'Lectura del juego': ['tactics', 'tactica'],
  },

  // RUTAS DE MODELO GUARDADO
  paths: {
    modelDir: './saved_model',
    vocabularyFile: './vocabulary.json',
    metricsFile: './training_metrics.json',
  },
};
