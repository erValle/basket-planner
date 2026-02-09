/**
 * Sistema de Scoring de Ejercicios
 *
 * Combina predicciones del modelo neuronal TFRS con reglas heurísticas.
 * También incluye funciones de scoring individual del modelo baseline.
 */

const config = require('./config');
const { HeuristicScorer } = require('./trainer');

/**
 * Scorer híbrido que combina NN y heurístico
 */
class TFRSExerciseScorer {
  constructor(tfrsModel) {
    this.tfrsModel = tfrsModel;
    this.heuristicScorer = new HeuristicScorer();
    this.weights = config.weights;
  }

  async scoreExercise(context, exercise, sessionState = {}) {
    const enrichedContext = this._enrichContext(context, sessionState);

    let neuralScore = 0.5;
    let heuristicScore = 0.5;

    heuristicScore = this.heuristicScorer.calculateScore(enrichedContext, exercise);

    if (this.tfrsModel && this.tfrsModel.isTrained) {
      try {
        neuralScore = await this.tfrsModel.predict(enrichedContext, exercise);
      } catch (error) {
        console.warn('Error in neural prediction, using heuristic only:', error.message);
        return {
          score: heuristicScore,
          breakdown: this._getHeuristicBreakdown(enrichedContext, exercise),
          source: 'heuristic_fallback',
        };
      }
    } else {
      return {
        score: heuristicScore,
        breakdown: this._getHeuristicBreakdown(enrichedContext, exercise),
        source: 'heuristic_only',
      };
    }

    const combinedScore =
      neuralScore * this.weights.neuralWeight + heuristicScore * this.weights.heuristicWeight;

    return {
      score: combinedScore,
      neuralScore,
      heuristicScore,
      breakdown: {
        ...this._getHeuristicBreakdown(enrichedContext, exercise),
        neural: neuralScore,
      },
      source: 'hybrid',
    };
  }

  async scoreExercises(context, exercises, sessionState = {}) {
    const enrichedContext = this._enrichContext(context, sessionState);
    const results = [];

    if (this.tfrsModel && this.tfrsModel.isTrained) {
      try {
        // Añadir timeout de 10 segundos para el modelo neural
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Neural prediction timeout')), 10000)
        );

        const neuralScores = await Promise.race([
          this.tfrsModel.predictBatch(enrichedContext, exercises),
          timeoutPromise,
        ]);

        for (let i = 0; i < exercises.length; i++) {
          const exercise = exercises[i];
          const neuralScore = neuralScores[i];
          const heuristicScore = this.heuristicScorer.calculateScore(enrichedContext, exercise);

          const combinedScore =
            neuralScore * this.weights.neuralWeight + heuristicScore * this.weights.heuristicWeight;

          results.push({
            exercise,
            score: combinedScore,
            neuralScore,
            heuristicScore,
            breakdown: {
              ...this._getHeuristicBreakdown(enrichedContext, exercise),
              neural: neuralScore,
            },
            source: 'hybrid',
          });
        }
      } catch (error) {
        console.warn('Error in batch neural prediction, falling back to heuristic:', error.message);
        return this._scoreExercisesHeuristic(enrichedContext, exercises);
      }
    } else {
      return this._scoreExercisesHeuristic(enrichedContext, exercises);
    }

    return results.sort((a, b) => b.score - a.score);
  }

  _scoreExercisesHeuristic(context, exercises) {
    return exercises
      .map((exercise) => {
        const heuristicScore = this.heuristicScorer.calculateScore(context, exercise);

        return {
          exercise,
          score: heuristicScore,
          heuristicScore,
          breakdown: this._getHeuristicBreakdown(context, exercise),
          source: 'heuristic_only',
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  _enrichContext(context, sessionState) {
    return {
      ...context,
      exercisesInSession: sessionState.exercisesSelected?.length || 0,
      typesUsedCount: sessionState.typesUsed?.length || 0,
      typesUsed: sessionState.typesUsed || [],
      usedExerciseIds: sessionState.usedExerciseIds || [],
      currentSessionMinutes: sessionState.currentMinutes || 0,
      remainingMinutes: (context.sessionDurationMinutes || 60) - (sessionState.currentMinutes || 0),
    };
  }

  _getHeuristicBreakdown(context, exercise) {
    return {
      tagMatch: this._calculateTagMatchScore(context, exercise),
      typeMatch: this._calculateTypeMatchScore(context, exercise),
      difficultyFit: this._calculateDifficultyFitScore(context, exercise),
      sessionPhaseFit: this._calculateSessionPhaseFitScore(context, exercise),
      typeVariety: this._calculateVarietyScore(context, exercise),
      uniqueness: this._calculateUniquenessScore(context, exercise),
    };
  }

  _calculateTagMatchScore(context, exercise) {
    if (!context.goals || context.goals.length === 0) return 0.5;
    if (!exercise.etiquetas || exercise.etiquetas.length === 0) return 0.3;

    let matchCount = 0;
    const exerciseTags = exercise.etiquetas.map((t) => t.toLowerCase());

    for (const goal of context.goals) {
      const relevantTags = config.goalToTags[goal.toLowerCase()] || [];
      for (const tag of relevantTags) {
        if (exerciseTags.includes(tag.toLowerCase())) {
          matchCount++;
        }
      }
    }

    return Math.min(1, matchCount / (context.goals.length * 2));
  }

  _calculateTypeMatchScore(context, exercise) {
    if (!context.goals || context.goals.length === 0) return 0.5;
    if (!exercise.tipo) return 0.3;

    const exerciseType = exercise.tipo.toUpperCase();

    for (const goal of context.goals) {
      const relevantTypes = config.goalToTypes[goal.toLowerCase()] || [];
      if (relevantTypes.includes(exerciseType)) {
        return 1.0;
      }
    }

    return 0.2;
  }

  _calculateDifficultyFitScore(context, exercise) {
    // Usar intensidad en lugar de playerLevel
    const difficultyRange =
      config.intensityToDifficulty[context.intensity] || config.intensityToDifficulty.medium;

    const avgDifficulty =
      ((exercise.dificultad_tactica || 3) +
        (exercise.dificultad_tecnica || 3) +
        (exercise.dificultad_fisica || 3) +
        (exercise.dificultad_mental || 3)) /
      4;

    const intensityMult = config.intensityMultiplier[context.intensity] || 1.0;
    const targetDifficulty = ((difficultyRange.min + difficultyRange.max) / 2) * intensityMult;

    const diff = Math.abs(avgDifficulty - targetDifficulty);
    return Math.max(0, 1 - diff / 2);
  }

  _calculateVarietyScore(context, exercise) {
    if (!context.typesUsed || context.typesUsed.length === 0) return 1.0;

    if (!context.typesUsed.includes(exercise.tipo)) {
      return 1.0;
    }

    return 0.3;
  }

  _calculateUniquenessScore(context, exercise) {
    if (!context.usedExerciseIds || context.usedExerciseIds.length === 0) return 1.0;

    if (context.usedExerciseIds.includes(exercise.id)) {
      return 0;
    }

    return 1.0;
  }

  _calculateSessionPhaseFitScore(context, exercise) {
    const sessionPhase = context.sessionPhase || 'technical';
    const exerciseType = exercise.tipo?.toUpperCase();

    if (!exerciseType) return 0.5;

    // Obtener tipos apropiados para esta fase
    const appropriateTypes = config.sessionPhaseTypes[sessionPhase] || [];

    let score = 0.5; // Base neutral

    // Bonus si el tipo de ejercicio es apropiado para la fase
    if (appropriateTypes.includes(exerciseType)) {
      score += 0.3;
    } else {
      score -= 0.1;
    }

    // Penalizaciones/bonificaciones adicionales por intensidad según fase
    const physicDifficulty = exercise.dificultad_fisica || 3;
    const technicDifficulty = exercise.dificultad_tecnica || 3;
    const tacticDifficulty = exercise.dificultad_tactica || 3;

    switch (sessionPhase) {
      case 'warmup':
        // Penalizar ejercicios de alta intensidad física en calentamiento
        if (physicDifficulty > 3) {
          score -= (physicDifficulty - 3) * 0.1;
        }
        // Favorecer ejercicios de baja/media intensidad
        if (physicDifficulty <= 2) {
          score += 0.1;
        }
        break;

      case 'technical':
        // Favorecer ejercicios con alta dificultad técnica
        if (technicDifficulty >= 3) {
          score += 0.1;
        }
        break;

      case 'tactical':
        // Favorecer ejercicios con componente táctico
        if (tacticDifficulty >= 3) {
          score += 0.1;
        }
        break;

      case 'conditioning':
        // Favorecer ejercicios de alta intensidad física
        if (physicDifficulty >= 4) {
          score += 0.15;
        }
        break;

      case 'recovery':
        // Penalizar fuertemente ejercicios intensos en recuperación
        if (physicDifficulty > 2) {
          score -= (physicDifficulty - 2) * 0.15;
        }
        // Favorecer ejercicios de muy baja intensidad
        if (physicDifficulty <= 2) {
          score += 0.2;
        }
        break;
    }

    // Limitar al rango [0, 1]
    return Math.max(0, Math.min(1, score));
  }
}

// ============================================================================
// FUNCIONES DE SCORING LEGACY (compatibilidad con código existente)
// ============================================================================

/**
 * Calcula la puntuación de coincidencia de etiquetas
 */
function scoreTagMatch(exerciseTags, relevantTags) {
  if (!exerciseTags || exerciseTags.length === 0) return 0;
  if (!relevantTags || relevantTags.length === 0) return 0.5;

  const matches = exerciseTags.filter((tag) =>
    relevantTags.some(
      (rt) =>
        tag.toLowerCase().includes(rt.toLowerCase()) || rt.toLowerCase().includes(tag.toLowerCase())
    )
  );

  return Math.min(1.0, matches.length / Math.max(exerciseTags.length * 0.5, 1));
}

/**
 * Calcula la puntuación de coincidencia de tipo
 */
function scoreTypeMatch(exerciseType, preferredTypes) {
  if (!preferredTypes || preferredTypes.length === 0) return 0.5;
  return preferredTypes.includes(exerciseType) ? 1.0 : 0.3;
}

/**
 * Obtiene pesos de dimensiones según objetivos
 */
function getDimensionWeights(objectives) {
  if (!objectives || objectives.length === 0) {
    return config.objectiveToDimensionWeights.default;
  }

  if (objectives.length === 1) {
    return (
      config.objectiveToDimensionWeights[objectives[0]] ||
      config.objectiveToDimensionWeights.default
    );
  }

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

  return {
    tactica: weights.tactica / validObjectives,
    tecnica: weights.tecnica / validObjectives,
    fisica: weights.fisica / validObjectives,
    mental: weights.mental / validObjectives,
  };
}

/**
 * Calcula qué tan apropiada es la dificultad del ejercicio
 * Usa intensidad en lugar de playerLevel
 */
function scoreDifficultyFit(exerciseDifficulty, intensity, objectives = []) {
  const range = config.intensityToDifficulty[intensity] || config.intensityToDifficulty.medium;
  const multiplier = config.intensityMultiplier[intensity] || 1.0;

  const dimensionWeights = getDimensionWeights(objectives);

  const weightedDifficulty =
    (exerciseDifficulty.tactica || 0) * dimensionWeights.tactica +
    (exerciseDifficulty.tecnica || 0) * dimensionWeights.tecnica +
    (exerciseDifficulty.fisica || 0) * dimensionWeights.fisica +
    (exerciseDifficulty.mental || 0) * dimensionWeights.mental;

  const adjustedDifficulty = weightedDifficulty * multiplier;

  if (adjustedDifficulty >= range.min && adjustedDifficulty <= range.max) {
    return 1.0;
  }

  const distanceFromRange =
    adjustedDifficulty < range.min
      ? range.min - adjustedDifficulty
      : adjustedDifficulty - range.max;

  return Math.max(0, 1 - distanceFromRange * 0.3);
}

/**
 * Calcula la contribución a la variedad de tipos
 */
function scoreTypeVariety(exerciseType, typesInSession) {
  if (!typesInSession || typesInSession.length === 0) return 1.0;

  const count = typesInSession.filter((t) => t === exerciseType).length;
  return Math.max(0, 1 - count * 0.25);
}

/**
 * Calcula la puntuación de unicidad
 */
function scoreUniqueness(exerciseId, exercisesInSession) {
  if (!exercisesInSession || exercisesInSession.length === 0) return 1.0;

  const count = exercisesInSession.filter((id) => id === exerciseId).length;
  return count === 0 ? 1.0 : Math.max(0, 1 - count * 0.5);
}

/**
 * Calcula la puntuación total de un ejercicio (legacy interface)
 */
function scoreExercise(exercise, context) {
  const weights = config.weights;

  const tagScore = scoreTagMatch(exercise.tags || exercise.etiquetas, context.relevantTags);

  const typeScore = scoreTypeMatch(exercise.type || exercise.tipo, context.preferredTypes);

  const difficultyScore = scoreDifficultyFit(
    exercise.difficulty || exercise.dificultad,
    context.intensity,
    context.objectives || []
  );

  const varietyScore = scoreTypeVariety(exercise.type || exercise.tipo, context.typesInSession);

  const uniquenessScore = scoreUniqueness(exercise.id, context.exercisesInSession);

  const totalScore =
    tagScore * weights.tagMatch +
    typeScore * weights.typeMatch +
    difficultyScore * weights.difficultyFit +
    varietyScore * weights.typeVariety +
    uniquenessScore * weights.uniqueness;

  return {
    totalScore,
    breakdown: {
      tagMatch: tagScore,
      typeMatch: typeScore,
      difficultyFit: difficultyScore,
      typeVariety: varietyScore,
      uniqueness: uniquenessScore,
    },
  };
}

module.exports = {
  TFRSExerciseScorer,
  // Legacy exports
  scoreTagMatch,
  scoreTypeMatch,
  scoreDifficultyFit,
  scoreTypeVariety,
  scoreUniqueness,
  scoreExercise,
  getDimensionWeights,
};
