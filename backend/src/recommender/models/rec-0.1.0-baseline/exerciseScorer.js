/**
 * Sistema de scoring para evaluar qué tan adecuado es un ejercicio
 * para una sesión de entrenamiento dada.
 */

const config = require('./config');

/**
 * Calcula la puntuación de coincidencia de etiquetas entre el ejercicio y los objetivos
 * @param {Array<string>} exerciseTags - Etiquetas del ejercicio
 * @param {Array<string>} relevantTags - Etiquetas relevantes derivadas de los objetivos
 * @returns {number} Puntuación de 0 a 1
 */
function scoreTagMatch(exerciseTags, relevantTags) {
  if (!exerciseTags || exerciseTags.length === 0) return 0;
  if (!relevantTags || relevantTags.length === 0) return 0.5; // neutral si no hay objetivos específicos
  
  const matches = exerciseTags.filter(tag => 
    relevantTags.some(rt => 
      tag.toLowerCase().includes(rt.toLowerCase()) || 
      rt.toLowerCase().includes(tag.toLowerCase())
    )
  );
  
  return Math.min(1.0, matches.length / Math.max(exerciseTags.length * 0.5, 1));
}

/**
 * Calcula la puntuación de coincidencia de tipo de ejercicio
 * @param {string} exerciseType - Tipo del ejercicio
 * @param {Array<string>} preferredTypes - Tipos preferidos para la sesión
 * @returns {number} Puntuación de 0 a 1
 */
function scoreTypeMatch(exerciseType, preferredTypes) {
  if (!preferredTypes || preferredTypes.length === 0) return 0.5;
  return preferredTypes.includes(exerciseType) ? 1.0 : 0.3;
}

/**
 * Determina los pesos de las dimensiones de dificultad según los objetivos
 * @param {Array<string>} objectives - Objetivos de la sesión
 * @returns {Object} Pesos para táctica, técnica, física, mental
 */
function getDimensionWeights(objectives) {
  if (!objectives || objectives.length === 0) {
    return config.objectiveToDimensionWeights.default;
  }
  
  // Si hay múltiples objetivos, promediar sus pesos
  if (objectives.length === 1) {
    return config.objectiveToDimensionWeights[objectives[0]] || 
           config.objectiveToDimensionWeights.default;
  }
  
  // Promedio de múltiples objetivos
  const weights = { tactica: 0, tecnica: 0, fisica: 0, mental: 0 };
  let validObjectives = 0;
  
  for (const obj of objectives) {
    const objWeights = config.objectiveToDimensionWeights[obj];
    if (objWeights) {
      weights.tactica += objWeights.tactica;
      weights.tecnica += objWeights.tecnica;
      weights.fisica += objWeights.fisica;
      weights.mental += objWeights.mental;
      validObjectives++;
    }
  }
  
  if (validObjectives === 0) {
    return config.objectiveToDimensionWeights.default;
  }
  
  // Normalizar
  return {
    tactica: weights.tactica / validObjectives,
    tecnica: weights.tecnica / validObjectives,
    fisica: weights.fisica / validObjectives,
    mental: weights.mental / validObjectives
  };
}

/**
 * Calcula qué tan apropiada es la dificultad del ejercicio para el nivel del jugador
 * @param {Object} exerciseDifficulty - Objeto con dificultades táctica, técnica, física, mental
 * @param {string} playerLevel - Nivel del jugador (beginner, intermediate, advanced)
 * @param {string} intensity - Intensidad de la sesión (low, medium, high)
 * @param {Array<string>} objectives - Objetivos de la sesión (opcional)
 * @returns {number} Puntuación de 0 a 1
 */
function scoreDifficultyFit(exerciseDifficulty, playerLevel, intensity, objectives = []) {
  const range = config.levelToDifficulty[playerLevel] || config.levelToDifficulty.intermediate;
  const multiplier = config.intensityMultiplier[intensity] || 1.0;
  
  // Obtener pesos de dimensiones según objetivos
  const dimensionWeights = getDimensionWeights(objectives);
  
  // Calcular dificultad ponderada según objetivos
  const weightedDifficulty = (
    (exerciseDifficulty.tactica || 0) * dimensionWeights.tactica +
    (exerciseDifficulty.tecnica || 0) * dimensionWeights.tecnica +
    (exerciseDifficulty.fisica || 0) * dimensionWeights.fisica +
    (exerciseDifficulty.mental || 0) * dimensionWeights.mental
  );
  
  const adjustedDifficulty = weightedDifficulty * multiplier;
  
  // Ideal: dentro del rango
  if (adjustedDifficulty >= range.min && adjustedDifficulty <= range.max) {
    return 1.0;
  }
  
  // Fuera del rango: penalizar según la distancia
  const distanceFromRange = adjustedDifficulty < range.min 
    ? range.min - adjustedDifficulty 
    : adjustedDifficulty - range.max;
  
  return Math.max(0, 1 - (distanceFromRange * 0.3));
}

/**
 * Calcula la contribución del ejercicio a la variedad de tipos en la sesión
 * @param {string} exerciseType - Tipo del ejercicio
 * @param {Array<string>} typesInSession - Tipos ya incluidos en la sesión
 * @returns {number} Puntuación de 0 a 1
 */
function scoreTypeVariety(exerciseType, typesInSession) {
  if (!typesInSession || typesInSession.length === 0) return 1.0;
  
  const count = typesInSession.filter(t => t === exerciseType).length;
  
  // Preferimos tipos que no se repitan mucho
  return Math.max(0, 1 - (count * 0.25));
}

/**
 * Calcula la puntuación de unicidad (evitar repetir el mismo ejercicio)
 * @param {string|number} exerciseId - ID del ejercicio
 * @param {Array<string|number>} exercisesInSession - IDs de ejercicios ya incluidos
 * @returns {number} Puntuación de 0 a 1
 */
function scoreUniqueness(exerciseId, exercisesInSession) {
  if (!exercisesInSession || exercisesInSession.length === 0) return 1.0;
  
  const count = exercisesInSession.filter(id => id === exerciseId).length;
  
  // Penalizar fuertemente repeticiones
  return count === 0 ? 1.0 : Math.max(0, 1 - (count * 0.5));
}

/**
 * Calcula la puntuación total de un ejercicio
 * @param {Object} exercise - Ejercicio a evaluar
 * @param {Object} context - Contexto de la sesión
 * @param {Array<string>} context.relevantTags - Etiquetas relevantes
 * @param {Array<string>} context.preferredTypes - Tipos preferidos
 * @param {string} context.playerLevel - Nivel del jugador
 * @param {string} context.intensity - Intensidad de la sesión
 * @param {Array<string>} context.typesInSession - Tipos ya en la sesión
 * @param {Array<string|number>} context.exercisesInSession - Ejercicios ya en la sesión
 * @param {Array<string>} context.objectives - Objetivos de la sesión (opcional)
 * @returns {number} Puntuación total ponderada de 0 a 1
 */
function scoreExercise(exercise, context) {
  const weights = config.weights;
  
  const tagScore = scoreTagMatch(
    exercise.tags || exercise.etiquetas,
    context.relevantTags
  );
  
  const typeScore = scoreTypeMatch(
    exercise.type || exercise.tipo,
    context.preferredTypes
  );
  
  const difficultyScore = scoreDifficultyFit(
    exercise.difficulty || exercise.dificultad,
    context.playerLevel,
    context.intensity,
    context.objectives || []
  );
  
  const varietyScore = scoreTypeVariety(
    exercise.type || exercise.tipo,
    context.typesInSession
  );
  
  const uniquenessScore = scoreUniqueness(
    exercise.id,
    context.exercisesInSession
  );
  
  const totalScore = (
    tagScore * weights.tagMatch +
    typeScore * weights.typeMatch +
    difficultyScore * weights.difficultyFit +
    varietyScore * weights.typeVariety +
    uniquenessScore * weights.uniqueness
  );
  
  return {
    totalScore,
    breakdown: {
      tagMatch: tagScore,
      typeMatch: typeScore,
      difficultyFit: difficultyScore,
      typeVariety: varietyScore,
      uniqueness: uniquenessScore
    }
  };
}

module.exports = {
  scoreTagMatch,
  scoreTypeMatch,
  scoreDifficultyFit,
  scoreTypeVariety,
  scoreUniqueness,
  scoreExercise,
  getDimensionWeights
};
