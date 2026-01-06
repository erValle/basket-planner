/**
 * Motor de recomendación principal - Modelo Baseline v0.1.0
 * 
 * Este es un modelo no reentrenable basado en reglas heurísticas que:
 * 1. Filtra ejercicios según materiales disponibles y restricciones
 * 2. Deriva etiquetas relevantes de los objetivos
 * 3. Puntúa cada ejercicio según múltiples criterios
 * 4. Genera sesiones balanceadas según fases y distribución temporal
 */

const config = require('./config');
const { scoreExercise } = require('./exerciseScorer');
const { filterExercises, filterBySessionPhase } = require('./exerciseFilter');

/**
 * Deriva etiquetas relevantes desde los objetivos especificados
 * @param {Array<string>} goals - Objetivos del entrenamiento
 * @returns {Array<string>} Etiquetas relevantes
 */
function deriveRelevantTags(goals) {
  if (!goals || goals.length === 0) {
    return config.goalToTags['fundamentals'] || [];
  }
  
  const tags = new Set();
  
  for (const goal of goals) {
    const goalLower = goal.toLowerCase().trim();
    
    // Buscar coincidencias exactas
    if (config.goalToTags[goalLower]) {
      config.goalToTags[goalLower].forEach(tag => tags.add(tag));
    } else {
      // Buscar coincidencias parciales
      for (const [key, tagList] of Object.entries(config.goalToTags)) {
        if (goalLower.includes(key) || key.includes(goalLower)) {
          tagList.forEach(tag => tags.add(tag));
        }
      }
    }
  }
  
  // Si no se encontraron coincidencias, usar fundamentals
  if (tags.size === 0) {
    return config.goalToTags['fundamentals'] || [];
  }
  
  return Array.from(tags);
}

/**
 * Deriva tipos preferidos de ejercicio desde los objetivos
 * @param {Array<string>} goals - Objetivos del entrenamiento
 * @returns {Array<string>} Tipos de ejercicio preferidos
 */
function derivePreferredTypes(goals) {
  if (!goals || goals.length === 0) {
    return config.goalToTypes['fundamentals'] || [];
  }
  
  const types = new Set();
  
  for (const goal of goals) {
    const goalLower = goal.toLowerCase().trim();
    
    if (config.goalToTypes[goalLower]) {
      config.goalToTypes[goalLower].forEach(type => types.add(type));
    } else {
      // Buscar coincidencias parciales
      for (const [key, typeList] of Object.entries(config.goalToTypes)) {
        if (goalLower.includes(key) || key.includes(goalLower)) {
          typeList.forEach(type => types.add(type));
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
 * @param {Array<Object>} availableExercises - Ejercicios disponibles
 * @param {Object} context - Contexto de selección
 * @param {number} targetDuration - Duración objetivo en minutos
 * @param {string} phase - Fase de la sesión
 * @param {number} maxDuration - Duración máxima permitida en minutos
 * @returns {Array<Object>} Ejercicios seleccionados con scores
 */
function selectExercisesForPhase(availableExercises, context, targetDuration, phase, maxDuration = null) {
  // Filtrar por fase
  const phaseExercises = filterBySessionPhase(availableExercises, phase);
  
  if (phaseExercises.length === 0) {
    return [];
  }
  
  // Puntuar todos los ejercicios
  const scoredExercises = phaseExercises.map(exercise => {
    const scoring = scoreExercise(exercise, context);
    return {
      ...exercise,
      score: scoring.totalScore,
      scoreBreakdown: scoring.breakdown
    };
  });
  
  // Ordenar por puntuación descendente
  scoredExercises.sort((a, b) => b.score - a.score);
  
  // Seleccionar ejercicios hasta alcanzar la duración objetivo
  const selected = [];
  let currentDuration = 0;
  const usedIds = new Set();
  
  // Si hay maxDuration, usar el menor entre targetDuration y maxDuration disponible
  const effectiveMax = maxDuration ? Math.min(targetDuration * 1.2, maxDuration) : targetDuration * 1.2;
  
  for (const exercise of scoredExercises) {
    // Evitar duplicados
    if (usedIds.has(exercise.id)) continue;
    
    const duration = Math.ceil((exercise.duracion_segundos || exercise.duration || 300) / 60);
    
    // Si agregar este ejercicio no excede la duración máxima
    if (currentDuration + duration <= effectiveMax || selected.length === 0) {
      selected.push(exercise);
      usedIds.add(exercise.id);
      currentDuration += duration;
      
      // Actualizar contexto para los siguientes
      context.typesInSession.push(exercise.type || exercise.tipo);
      context.exercisesInSession.push(exercise.id);
      
      // Si alcanzamos la duración objetivo, terminamos
      if (currentDuration >= targetDuration * 0.9) {
        break;
      }
    }
  }
  
  return selected;
}

/**
 * Genera una sesión de entrenamiento completa
 * @param {Array<Object>} allExercises - Todos los ejercicios disponibles
 * @param {Object} sessionParams - Parámetros de la sesión
 * @returns {Object} Sesión generada
 */
function generateSession(allExercises, sessionParams) {
  const {
    sessionId,
    day,
    goals = [],
    constraints = {},
    playerLevel = 'intermediate',
    intensity = 'medium',
    durationMinutes = 90,
    maxDurationMinutes = null
  } = sessionParams;
  
  // 1. Filtrar ejercicios según restricciones
  const filteredExercises = filterExercises(allExercises, constraints);
  
  if (filteredExercises.length === 0) {
    throw new Error('No hay ejercicios disponibles con las restricciones especificadas');
  }
  
  // Si hay maxDurationMinutes, ajustar la duración objetivo
  const effectiveDuration = maxDurationMinutes 
    ? Math.min(durationMinutes, maxDurationMinutes)
    : durationMinutes;
  
  // 2. Derivar etiquetas y tipos relevantes
  const relevantTags = deriveRelevantTags(goals);
  const preferredTypes = derivePreferredTypes(goals);
  
  // 3. Preparar contexto para scoring
  const context = {
    relevantTags,
    preferredTypes,
    playerLevel,
    intensity,
    typesInSession: [],
    exercisesInSession: [],
    objectives: goals || []  // Agregar objetivos para ponderación de dificultad
  };
  
  // 4. Generar cada fase de la sesión
  const phases = [
    { name: 'warmup', duration: Math.ceil(effectiveDuration * config.sessionTypeDistribution.warmup) },
    { name: 'technical', duration: Math.ceil(effectiveDuration * config.sessionTypeDistribution.technical) },
    { name: 'tactical', duration: Math.ceil(effectiveDuration * config.sessionTypeDistribution.tactical) },
    { name: 'conditioning', duration: Math.ceil(effectiveDuration * config.sessionTypeDistribution.conditioning) },
    { name: 'recovery', duration: Math.ceil(effectiveDuration * config.sessionTypeDistribution.recovery) }
  ];
  
  const sessionExercises = [];
  let totalDuration = 0;
  const remainingDuration = maxDurationMinutes || (effectiveDuration * 1.2);
  
  for (const phase of phases) {
    // Calcular cuánto tiempo queda disponible
    const availableDuration = remainingDuration - totalDuration;
    if (availableDuration <= 0) break;
    
    const phaseExercises = selectExercisesForPhase(
      filteredExercises,
      context,
      Math.min(phase.duration, availableDuration),
      phase.name,
      availableDuration
    );
    
    for (const exercise of phaseExercises) {
      const duration = Math.ceil((exercise.duracion_segundos || exercise.duration || 300) / 60);
      
      // Verificar que no excedemos el máximo
      if (maxDurationMinutes && totalDuration + duration > maxDurationMinutes) {
        break;
      }
      
      sessionExercises.push({
        exerciseId: exercise.id,
        name: exercise.name || exercise.nombre,
        description: exercise.description || exercise.descripcion,
        type: exercise.type || exercise.tipo,
        phase: phase.name,
        durationMinutes: duration,
        difficulty: exercise.difficulty || exercise.dificultad,
        tags: exercise.tags || exercise.etiquetas,
        score: exercise.score,
        intensity
      });
      totalDuration += duration;
    }
    
    // Si ya alcanzamos el máximo, parar
    if (maxDurationMinutes && totalDuration >= maxDurationMinutes) {
      break;
    }
  }
  
  return {
    sessionId,
    day,
    goals,
    exercises: sessionExercises,
    metrics: {
      durationMinutes: totalDuration,
      exerciseCount: sessionExercises.length,
      intensity,
      maxDurationRespected: maxDurationMinutes ? totalDuration <= maxDurationMinutes : true
    },
    metadata: {
      modelVersion: config.modelVersion,
      relevantTags,
      preferredTypes,
      generatedAt: new Date().toISOString(),
      maxDurationMinutes
    }
  };
}

/**
 * Genera una planificación completa (múltiples sesiones)
 * @param {Array<Object>} allExercises - Todos los ejercicios disponibles
 * @param {Object} planParams - Parámetros de la planificación
 * @returns {Object} Planificación generada
 */
function generatePlan(allExercises, planParams) {
  const {
    goals = [],
    constraints = {},
    profile = {},
    numberOfSessions = 3,
    days = ['mon', 'wed', 'fri']
  } = planParams;
  
  const sessions = [];
  const sessionsToGenerate = Math.min(numberOfSessions, days.length);
  const maxDurationMinutes = profile.maxDurationMinutes || null;
  
  for (let i = 0; i < sessionsToGenerate; i++) {
    const session = generateSession(allExercises, {
      sessionId: `session-${i + 1}`,
      day: days[i],
      goals,
      constraints,
      playerLevel: profile.level || 'intermediate',
      intensity: profile.intensity || 'medium',
      durationMinutes: profile.sessionDurationMinutes || 90,
      maxDurationMinutes
    });
    
    sessions.push(session);
  }
  
  // Calcular métricas totales
  const totalDuration = sessions.reduce((sum, s) => sum + s.metrics.durationMinutes, 0);
  const totalExercises = sessions.reduce((sum, s) => sum + s.metrics.exerciseCount, 0);
  
  return {
    modelVersion: config.modelVersion,
    generatedAt: new Date().toISOString(),
    sessions,
    summary: {
      totalSessions: sessions.length,
      totalDurationMinutes: totalDuration,
      totalExercises,
      goals,
      days: days.slice(0, sessionsToGenerate),
      maxDurationMinutes,
      maxDurationRespected: sessions.every(s => s.metrics.maxDurationRespected)
    }
  };
}

module.exports = {
  generateSession,
  generatePlan,
  deriveRelevantTags,
  derivePreferredTypes,
  config
};
