/**
 * Motor de Recomendación Principal
 *
 * Utiliza TensorFlow.js para el ranking de ejercicios,
 * combinando predicciones neuronales con reglas heurísticas.
 */

const config = require('./config');
const TFRSRankingModel = require('./tfrsModel');
const { TFRSExerciseScorer, scoreExercise } = require('./exerciseScorer');
const { filterExercises, filterBySessionPhase } = require('./exerciseFilter');
const { HeuristicScorer } = require('./trainer');

// Instancia del modelo (singleton)
let modelInstance = null;
let scorerInstance = null;
let isInitialized = false;

/**
 * Inicializa el modelo TFRS
 * Por defecto intenta cargar un modelo pre-entrenado si existe.
 * Si no existe, construye uno nuevo (sin entrenar, usará solo heurístico).
 *
 * @param {Array} exercises - Lista de ejercicios para inicializar vocabularios
 * @param {boolean} loadPretrained - Si true (default), intenta cargar modelo guardado
 */
async function initializeModel(exercises = [], loadPretrained = true) {
  if (isInitialized && modelInstance) {
    return { model: modelInstance, scorer: scorerInstance };
  }

  modelInstance = new TFRSRankingModel();

  if (loadPretrained) {
    try {
      await modelInstance.loadModel();
      // También necesitamos inicializar vocabularios para encoding
      modelInstance.initializeVocabularies(exercises);
      console.log('Loaded pre-trained TFRS model (isTrained:', modelInstance.isTrained, ')');
    } catch (error) {
      console.log('No pre-trained model found, building new model:', error.message);
      modelInstance.buildModel(exercises);
    }
  } else {
    modelInstance.buildModel(exercises);
  }

  scorerInstance = new TFRSExerciseScorer(modelInstance);
  isInitialized = true;

  return { model: modelInstance, scorer: scorerInstance };
}

/**
 * Normaliza los goals recibidos del frontend.
 * Convierte los textos de OBJECTIVE_OPTIONS (ej: "Mejora del tiro exterior")
 * a los goals reconocidos por el modelo (ej: ["shooting", "tiro"]).
 *
 * También acepta goals que ya estén en el formato del modelo y los pasa sin cambios.
 *
 * @param {string[]} inputGoals - Array de goals del frontend (pueden ser textos largos o goals ya normalizados)
 * @returns {string[]} - Array de goals normalizados reconocidos por el modelo
 */
function normalizeGoals(inputGoals) {
  if (!inputGoals || inputGoals.length === 0) {
    return [];
  }

  const normalizedGoals = new Set();
  const knownGoals = new Set(config.vocabularies.goals);

  for (const goal of inputGoals) {
    if (!goal || typeof goal !== 'string') continue;

    const trimmedGoal = goal.trim();

    // 1. Primero intentar mapeo directo del frontend
    if (config.frontendObjectiveToGoals && config.frontendObjectiveToGoals[trimmedGoal]) {
      config.frontendObjectiveToGoals[trimmedGoal].forEach((g) => normalizedGoals.add(g));
      continue;
    }

    // 2. Si el goal ya está en el vocabulario conocido, usarlo directamente
    const lowerGoal = trimmedGoal.toLowerCase();
    if (knownGoals.has(lowerGoal)) {
      normalizedGoals.add(lowerGoal);
      continue;
    }

    // 3. Búsqueda parcial en el mapeo del frontend (por si hay variaciones)
    let found = false;
    for (const [frontendKey, modelGoals] of Object.entries(config.frontendObjectiveToGoals || {})) {
      if (
        frontendKey.toLowerCase().includes(lowerGoal) ||
        lowerGoal.includes(frontendKey.toLowerCase())
      ) {
        modelGoals.forEach((g) => normalizedGoals.add(g));
        found = true;
        break;
      }
    }

    if (found) continue;

    // 4. Búsqueda parcial en el vocabulario conocido
    for (const knownGoal of knownGoals) {
      if (lowerGoal.includes(knownGoal) || knownGoal.includes(lowerGoal)) {
        normalizedGoals.add(knownGoal);
        found = true;
      }
    }

    // 5. Si nada coincide, usar 'fundamentals' como fallback
    if (!found && normalizedGoals.size === 0) {
      normalizedGoals.add('fundamentals');
    }
  }

  return Array.from(normalizedGoals);
}

/**
 * Deriva etiquetas relevantes desde los objetivos
 */
function deriveRelevantTags(goals) {
  if (!goals || goals.length === 0) {
    return config.goalToTags['fundamentals'] || [];
  }

  const tags = new Set();

  for (const goal of goals) {
    const goalLower = goal.toLowerCase().trim();

    if (config.goalToTags[goalLower]) {
      config.goalToTags[goalLower].forEach((tag) => tags.add(tag));
    } else {
      for (const [key, tagList] of Object.entries(config.goalToTags)) {
        if (goalLower.includes(key) || key.includes(goalLower)) {
          tagList.forEach((tag) => tags.add(tag));
        }
      }
    }
  }

  if (tags.size === 0) {
    return config.goalToTags['fundamentals'] || [];
  }

  return Array.from(tags);
}

/**
 * Deriva tipos preferidos de ejercicio desde los objetivos
 */
function derivePreferredTypes(goals) {
  if (!goals || goals.length === 0) {
    return config.goalToTypes['fundamentals'] || [];
  }

  const types = new Set();

  for (const goal of goals) {
    const goalLower = goal.toLowerCase().trim();

    if (config.goalToTypes[goalLower]) {
      config.goalToTypes[goalLower].forEach((type) => types.add(type));
    } else {
      for (const [key, typeList] of Object.entries(config.goalToTypes)) {
        if (goalLower.includes(key) || key.includes(goalLower)) {
          typeList.forEach((type) => types.add(type));
        }
      }
    }
  }

  if (types.size === 0) {
    return config.goalToTypes['fundamentals'] || [];
  }

  return Array.from(types);
}

/**
 * Selecciona los mejores ejercicios para una fase de sesión
 */
async function selectExercisesForPhase(
  availableExercises,
  context,
  targetDuration,
  phase,
  maxDuration = null
) {
  const phaseExercises = filterBySessionPhase(availableExercises, phase);

  if (phaseExercises.length === 0) {
    return [];
  }

  const scoringContext = {
    ...context,
    sessionPhase: phase,
  };

  const sessionState = {
    exercisesSelected: context.exercisesInSession || [],
    typesUsed: context.typesInSession || [],
    usedExerciseIds: context.exercisesInSession || [],
    currentMinutes: context.currentDuration || 0,
  };

  let scoredExercises;
  if (scorerInstance && modelInstance?.isTrained) {
    scoredExercises = await scorerInstance.scoreExercises(
      scoringContext,
      phaseExercises,
      sessionState
    );
  } else {
    // Fallback a heurístico
    const heuristicScorer = new HeuristicScorer();
    scoredExercises = phaseExercises
      .map((exercise) => {
        const score = heuristicScorer.calculateScore(scoringContext, exercise);
        return { exercise, score, source: 'heuristic_fallback' };
      })
      .sort((a, b) => b.score - a.score);
  }

  const selected = [];
  let currentDuration = 0;
  const usedIds = new Set(context.exercisesInSession || []);

  const effectiveMax = maxDuration
    ? Math.min(targetDuration * 1.2, maxDuration)
    : targetDuration * 1.2;

  for (const scoredItem of scoredExercises) {
    const exercise = scoredItem.exercise || scoredItem;

    if (usedIds.has(exercise.id)) continue;

    const duration = Math.ceil((exercise.duracion_segundos || exercise.duration || 300) / 60);

    if (currentDuration + duration <= effectiveMax || selected.length === 0) {
      selected.push({
        ...exercise,
        score: scoredItem.score,
        scoreBreakdown: scoredItem.breakdown || {},
        scoreSource: scoredItem.source || 'hybrid',
      });
      usedIds.add(exercise.id);
      currentDuration += duration;

      context.typesInSession.push(exercise.type || exercise.tipo);
      context.exercisesInSession.push(exercise.id);
      context.currentDuration = (context.currentDuration || 0) + duration;

      if (currentDuration >= targetDuration * 0.9) {
        break;
      }
    }
  }

  return selected;
}

/**
 * Genera una sesión de entrenamiento completa
 */
async function generateSession(allExercises, sessionParams) {
  const {
    sessionId,
    sessionIndex = 0,
    goals = [],
    constraints = {},
    intensity = 'medium',
    durationMinutes = 90,
    maxDurationMinutes = null,
  } = sessionParams;

  if (!isInitialized) {
    await initializeModel(allExercises, true);
  }

  const filteredExercises = filterExercises(allExercises, constraints);

  if (filteredExercises.length === 0) {
    throw new Error('No hay ejercicios disponibles con las restricciones especificadas');
  }

  const effectiveDuration = maxDurationMinutes
    ? Math.min(durationMinutes, maxDurationMinutes)
    : durationMinutes;

  const relevantTags = deriveRelevantTags(goals);
  const preferredTypes = derivePreferredTypes(goals);

  const context = {
    relevantTags,
    preferredTypes,
    intensity,
    goals,
    sessionDurationMinutes: effectiveDuration,
    typesInSession: [],
    exercisesInSession: [],
    currentDuration: 0,
    objectives: goals,
  };

  const phases = [
    {
      name: 'warmup',
      duration: Math.ceil(effectiveDuration * config.sessionTypeDistribution.warmup),
    },
    {
      name: 'technical',
      duration: Math.ceil(effectiveDuration * config.sessionTypeDistribution.technical),
    },
    {
      name: 'tactical',
      duration: Math.ceil(effectiveDuration * config.sessionTypeDistribution.tactical),
    },
    {
      name: 'conditioning',
      duration: Math.ceil(effectiveDuration * config.sessionTypeDistribution.conditioning),
    },
    {
      name: 'recovery',
      duration: Math.ceil(effectiveDuration * config.sessionTypeDistribution.recovery),
    },
  ];

  const sessionExercises = [];
  let totalDuration = 0;
  const remainingDuration = maxDurationMinutes || effectiveDuration * 1.2;

  for (const phase of phases) {
    const availableDuration = remainingDuration - totalDuration;
    if (availableDuration <= 0) break;

    const phaseExercises = await selectExercisesForPhase(
      filteredExercises,
      context,
      Math.min(phase.duration, availableDuration),
      phase.name,
      availableDuration
    );

    for (const exercise of phaseExercises) {
      const duration = Math.ceil((exercise.duracion_segundos || exercise.duration || 300) / 60);

      if (maxDurationMinutes && totalDuration + duration > maxDurationMinutes) {
        break;
      }

      // Formato compatible con el frontend - solo duración, sin series/reps/descanso
      sessionExercises.push({
        exerciseId: exercise.id,
        name: exercise.name || exercise.nombre,
        description: exercise.description || exercise.descripcion,
        type: exercise.type || exercise.tipo,
        phase: phase.name,
        durationMinutes: duration,
        difficulty: exercise.difficulty || exercise.dificultad,
        tags: exercise.tags || exercise.etiquetas,
        equipment:
          exercise.materiales_necesarios || (exercise.tags && exercise.tags.materiales) || [],
        material:
          exercise.materiales_necesarios || (exercise.tags && exercise.tags.materiales) || [],
        // Campos de scoring
        score: exercise.score,
        scoreBreakdown: exercise.scoreBreakdown,
        scoreSource: exercise.scoreSource,
        intensity,
      });
      totalDuration += duration;
    }

    if (maxDurationMinutes && totalDuration >= maxDurationMinutes) {
      break;
    }
  }

  return {
    sessionId,
    sessionIndex,
    goals,
    exercises: sessionExercises,
    totalDuration,
    metrics: {
      durationMinutes: totalDuration,
      exerciseCount: sessionExercises.length,
      intensity,
      maxDurationRespected: maxDurationMinutes ? totalDuration <= maxDurationMinutes : true,
      modelUsed: modelInstance?.isTrained ? 'tfrs-hybrid' : 'heuristic-only',
    },
    metadata: {
      modelVersion: config.modelVersion,
      relevantTags,
      preferredTypes,
      generatedAt: new Date().toISOString(),
      maxDurationMinutes,
      tfrsModelTrained: modelInstance?.isTrained || false,
    },
  };
}

/**
 * Genera una planificación completa (múltiples sesiones) con variación inteligente de ejercicios
 *
 * Estrategia de repetición basada en adecuación al objetivo:
 * - Ejercicios con alta adecuación (score >= 0.90): Pueden repetirse en todas las sesiones (son clave para los objetivos)
 * - Ejercicios con media adecuación (0.75 <= score < 0.90): Pueden repetirse máximo en 2 sesiones
 * - Ejercicios con baja adecuación (score < 0.75): No se repiten, maximiza variedad
 *
 * @param {Array} allExercises - Lista de ejercicios disponibles
 * @param {Object} planParams - Parámetros del plan
 * @param {Object} options - Opciones adicionales
 * @param {AbortSignal} options.signal - Señal para abortar la generación
 * @param {Function} options.onSessionGenerated - Callback cuando se genera una sesión (para streaming)
 */
async function generatePlan(allExercises, planParams, options = {}) {
  const { signal, onSessionGenerated } = options;

  const { goals: rawGoals = [], constraints = {}, profile = {}, numberOfSessions = 3 } = planParams;

  // Normalizar goals del frontend a goals del modelo
  const goals = normalizeGoals(rawGoals);

  if (signal?.aborted) {
    return createEmptyPlanResult(goals);
  }

  if (!isInitialized) {
    await initializeModel(allExercises, true);
  }

  const maxDurationMinutes = profile.maxDurationMinutes || null;
  const sessionDuration = profile.sessionDurationMinutes || 90;
  const intensity = profile.intensity || 'medium';

  // Filtrar ejercicios por restricciones
  const filteredExercises = filterExercises(allExercises, constraints);

  if (filteredExercises.length === 0) {
    throw new Error('No hay ejercicios disponibles con las restricciones especificadas');
  }

  // Calcular umbrales dinámicos basados en la cantidad de ejercicios disponibles
  // Si hay pocos ejercicios, permitimos más repetición
  const exerciseScarcity = Math.min(1, filteredExercises.length / (numberOfSessions * 15));

  // Umbrales de adecuación para decidir repetición (ajustables según disponibilidad)
  const HIGH_FIT_THRESHOLD = exerciseScarcity < 0.5 ? 0.6 : 0.8; // Más permisivo con pocos ejercicios
  const MEDIUM_FIT_THRESHOLD = exerciseScarcity < 0.5 ? 0.4 : 0.6; // Más permisivo
  const MAX_REPETITIONS_MEDIUM = exerciseScarcity < 0.5 ? 3 : 2; // Permitir más repeticiones
  const MAX_REPETITIONS_HIGH = numberOfSessions;

  const effectiveDuration = maxDurationMinutes
    ? Math.min(sessionDuration, maxDurationMinutes)
    : sessionDuration;

  const relevantTags = deriveRelevantTags(goals);
  const preferredTypes = derivePreferredTypes(goals);

  // Definir fases de sesión
  const phases = [
    {
      name: 'warmup',
      duration: Math.ceil(effectiveDuration * config.sessionTypeDistribution.warmup),
    },
    {
      name: 'technical',
      duration: Math.ceil(effectiveDuration * config.sessionTypeDistribution.technical),
    },
    {
      name: 'tactical',
      duration: Math.ceil(effectiveDuration * config.sessionTypeDistribution.tactical),
    },
    {
      name: 'conditioning',
      duration: Math.ceil(effectiveDuration * config.sessionTypeDistribution.conditioning),
    },
    {
      name: 'recovery',
      duration: Math.ceil(effectiveDuration * config.sessionTypeDistribution.recovery),
    },
  ];

  // PASO 1: Generar pool de ejercicios puntuados por fase
  const exercisePoolByPhase = {};
  let maxScoreGlobal = 0;

  for (const phase of phases) {
    const phaseExercises = filterBySessionPhase(filteredExercises, phase.name);

    if (phaseExercises.length === 0) {
      exercisePoolByPhase[phase.name] = [];
      continue;
    }

    const scoringContext = {
      relevantTags,
      preferredTypes,
      intensity,
      goals,
      sessionDurationMinutes: effectiveDuration,
      sessionPhase: phase.name,
      objectives: goals,
    };

    let scoredExercises;
    if (scorerInstance && modelInstance?.isTrained) {
      scoredExercises = await scorerInstance.scoreExercises(scoringContext, phaseExercises, {});
    } else {
      const heuristicScorer = new HeuristicScorer();
      scoredExercises = phaseExercises
        .map((exercise) => {
          const score = heuristicScorer.calculateScore(scoringContext, exercise);
          return { exercise, score, source: 'heuristic_fallback' };
        })
        .sort((a, b) => b.score - a.score);
    }

    // Calcular max score para normalización
    if (scoredExercises.length > 0) {
      const phaseMax = Math.max(...scoredExercises.map((s) => s.score));
      if (phaseMax > maxScoreGlobal) maxScoreGlobal = phaseMax;
    }

    exercisePoolByPhase[phase.name] = scoredExercises;
  }

  // Normalizar scores si es necesario (para que umbrales funcionen correctamente)
  if (maxScoreGlobal > 1) {
    for (const phase of Object.keys(exercisePoolByPhase)) {
      exercisePoolByPhase[phase] = exercisePoolByPhase[phase].map((item) => ({
        ...item,
        score: item.score / maxScoreGlobal,
        rawScore: item.score, // Guardamos el score original
      }));
    }
  }

  // PASO 2: Distribuir ejercicios entre sesiones con estrategia de repetición inteligente
  const sessions = [];
  const exerciseUsageCount = new Map(); // exerciseId -> número de sesiones donde aparece

  for (let sessionIdx = 0; sessionIdx < numberOfSessions; sessionIdx++) {
    // Verificar si se canceló la generación
    if (signal?.aborted) {
      break;
    }

    const sessionExercises = [];
    let totalDuration = 0;
    const sessionExerciseIds = new Set(); // Evitar duplicados dentro de la misma sesión

    for (const phase of phases) {
      const availableDuration = (maxDurationMinutes || effectiveDuration * 1.2) - totalDuration;
      if (availableDuration <= 0) break;

      const targetPhaseDuration = Math.min(phase.duration, availableDuration);
      const phasePool = exercisePoolByPhase[phase.name] || [];

      // Aplicar estrategia de selección basada en adecuación
      const candidatesWithPriority = phasePool
        .map((item) => {
          const exercise = item.exercise || item;
          const exerciseId = exercise.id;
          const normalizedScore = item.score;
          const usageCount = exerciseUsageCount.get(exerciseId) || 0;

          // Ya usado en esta sesión - no permitir
          if (sessionExerciseIds.has(exerciseId)) {
            return { ...item, effectiveScore: -1, reason: 'already_in_session' };
          }

          // Determinar si puede repetirse según su adecuación
          let effectiveScore = normalizedScore;
          let reason = 'new';

          if (usageCount > 0) {
            if (normalizedScore >= HIGH_FIT_THRESHOLD) {
              // Alta adecuación: puede repetirse en todas las sesiones
              if (usageCount >= MAX_REPETITIONS_HIGH) {
                effectiveScore = normalizedScore * 0.3; // Aún permitir pero con penalización
              } else {
                effectiveScore = normalizedScore * (1 - usageCount * 0.1);
              }
              reason = 'high_fit_repeat';
            } else if (normalizedScore >= MEDIUM_FIT_THRESHOLD) {
              // Media adecuación: repetición limitada
              if (usageCount >= MAX_REPETITIONS_MEDIUM) {
                effectiveScore = normalizedScore * 0.2; // Penalización fuerte pero no bloquear
                reason = 'medium_fit_max_reached';
              } else {
                effectiveScore = normalizedScore * 0.6;
                reason = 'medium_fit_repeat';
              }
            } else {
              // Baja adecuación: permitir repetición con fuerte penalización si hay escasez
              if (exerciseScarcity < 0.5) {
                effectiveScore = normalizedScore * 0.3; // Permitir con penalización
                reason = 'low_fit_scarce_repeat';
              } else {
                effectiveScore = -1; // No permitir repetición
                reason = 'low_fit_no_repeat';
              }
            }
          }

          return { ...item, effectiveScore, reason, usageCount };
        })
        .filter((item) => item.effectiveScore > 0)
        .sort((a, b) => b.effectiveScore - a.effectiveScore);

      let phaseDuration = 0;

      for (const candidate of candidatesWithPriority) {
        const exercise = candidate.exercise || candidate;
        const exerciseId = exercise.id;

        const duration = Math.ceil((exercise.duracion_segundos || exercise.duration || 300) / 60);

        // Verificar si cabe en la sesión
        if (phaseDuration + duration > targetPhaseDuration * 1.2 && sessionExercises.length > 0) {
          if (phaseDuration >= targetPhaseDuration * 0.7) break;
          continue;
        }

        if (maxDurationMinutes && totalDuration + duration > maxDurationMinutes) {
          break;
        }

        const isRepeated = (exerciseUsageCount.get(exerciseId) || 0) > 0;

        sessionExercises.push({
          exerciseId: exercise.id,
          name: exercise.name || exercise.nombre,
          description: exercise.description || exercise.descripcion,
          type: exercise.type || exercise.tipo,
          phase: phase.name,
          durationMinutes: duration,
          difficulty: exercise.difficulty || exercise.dificultad,
          tags: exercise.tags || exercise.etiquetas,
          equipment:
            exercise.materiales_necesarios || (exercise.tags && exercise.tags.materiales) || [],
          material:
            exercise.materiales_necesarios || (exercise.tags && exercise.tags.materiales) || [],
          score: candidate.rawScore || candidate.score,
          normalizedScore: candidate.score,
          fitLevel:
            candidate.score >= HIGH_FIT_THRESHOLD
              ? 'high'
              : candidate.score >= MEDIUM_FIT_THRESHOLD
                ? 'medium'
                : 'low',
          isRepeated,
          repeatReason: isRepeated ? candidate.reason : null,
          scoreBreakdown: candidate.breakdown || {},
          scoreSource: candidate.source || 'hybrid',
          intensity,
        });

        sessionExerciseIds.add(exerciseId);
        exerciseUsageCount.set(exerciseId, (exerciseUsageCount.get(exerciseId) || 0) + 1);
        phaseDuration += duration;
        totalDuration += duration;

        if (phaseDuration >= targetPhaseDuration * 0.9) break;
      }

      if (maxDurationMinutes && totalDuration >= maxDurationMinutes) break;
    }

    sessions.push({
      sessionId: `session-${sessionIdx + 1}`,
      sessionIndex: sessionIdx,
      goals,
      exercises: sessionExercises,
      metrics: {
        durationMinutes: totalDuration,
        exerciseCount: sessionExercises.length,
        uniqueInSession: sessionExerciseIds.size,
        repeatedFromOtherSessions: sessionExercises.filter((e) => e.isRepeated).length,
        intensity,
        maxDurationRespected: maxDurationMinutes ? totalDuration <= maxDurationMinutes : true,
        modelUsed: modelInstance?.isTrained ? 'tfrs-hybrid' : 'heuristic-only',
      },
      metadata: {
        modelVersion: config.modelVersion,
        relevantTags,
        preferredTypes,
        generatedAt: new Date().toISOString(),
        maxDurationMinutes,
        tfrsModelTrained: modelInstance?.isTrained || false,
      },
    });

    // Notificar progreso si hay callback
    if (onSessionGenerated) {
      onSessionGenerated(sessions[sessions.length - 1], sessionIdx + 1, numberOfSessions);
    }
  }

  // Indicar si se completó o se abortó
  const wasAborted = signal?.aborted && sessions.length < numberOfSessions;

  // Calcular métricas finales
  const totalDuration = sessions.reduce((sum, s) => sum + s.metrics.durationMinutes, 0);
  const totalExercises = sessions.reduce((sum, s) => sum + s.metrics.exerciseCount, 0);
  const uniqueExercises = exerciseUsageCount.size;
  const repeatedExercises = Array.from(exerciseUsageCount.values()).filter(
    (count) => count > 1
  ).length;
  const highFitRepeats = sessions.reduce(
    (sum, s) => sum + s.exercises.filter((e) => e.isRepeated && e.fitLevel === 'high').length,
    0
  );

  return {
    modelVersion: config.modelVersion,
    generatedAt: new Date().toISOString(),
    sessions,
    wasAborted,
    requestedSessions: numberOfSessions,
    summary: {
      totalSessions: sessions.length,
      totalDurationMinutes: totalDuration,
      totalExercises,
      uniqueExercises,
      repeatedExercises,
      exerciseVariety:
        totalExercises > 0 ? ((uniqueExercises / totalExercises) * 100).toFixed(1) + '%' : '0%',
      highFitRepeats, // Ejercicios de alta adecuación que se repitieron
      goals,
      maxDurationMinutes,
      maxDurationRespected: sessions.every((s) => s.metrics.maxDurationRespected),
      tfrsModelTrained: modelInstance?.isTrained || false,
      wasAborted,
      repetitionStrategy: {
        highFitThreshold: HIGH_FIT_THRESHOLD,
        mediumFitThreshold: MEDIUM_FIT_THRESHOLD,
        maxRepetitionsForMediumFit: MAX_REPETITIONS_MEDIUM,
        description: 'Ejercicios con alta adecuación al objetivo pueden repetirse entre sesiones',
      },
    },
  };
}

/**
 * Crea un resultado de plan vacío (para casos de abort temprano)
 */
function createEmptyPlanResult(goals) {
  return {
    modelVersion: config.modelVersion,
    generatedAt: new Date().toISOString(),
    sessions: [],
    wasAborted: true,
    requestedSessions: 0,
    summary: {
      totalSessions: 0,
      totalDurationMinutes: 0,
      totalExercises: 0,
      uniqueExercises: 0,
      repeatedExercises: 0,
      exerciseVariety: '0%',
      highFitRepeats: 0,
      goals,
      maxDurationMinutes: null,
      maxDurationRespected: true,
      tfrsModelTrained: false,
      wasAborted: true,
    },
  };
}

/**
 * Obtiene información del modelo
 */
function getModelInfo() {
  return {
    version: config.modelVersion,
    description: config.description,
    isInitialized,
    isTrained: modelInstance?.isTrained || false,
    architecture: config.architecture,
    weights: config.weights,
  };
}

/**
 * Obtiene la configuración del modelo
 */
function getModelConfig() {
  return config;
}

module.exports = {
  initializeModel,
  generateSession,
  generatePlan,
  normalizeGoals,
  deriveRelevantTags,
  derivePreferredTypes,
  getModelInfo,
  getModelConfig,
};
