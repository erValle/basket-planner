/**
 * Sistema de Entrenamiento para el Modelo TFRS
 */

const tf = require('@tensorflow/tfjs');
const config = require('./config');

class TFRSTrainer {
  constructor(model) {
    this.model = model;
    this.trainingHistory = [];
  }

  generateSyntheticTrainingData(exercises, numSamples = 10000) {
    const trainingData = [];
    const heuristicScorer = new HeuristicScorer();

    for (let i = 0; i < numSamples; i++) {
      const context = this._generateRandomContext();
      const exercise = exercises[Math.floor(Math.random() * exercises.length)];
      const heuristicScore = heuristicScorer.calculateScore(context, exercise);

      trainingData.push({
        context,
        exercise,
        label: heuristicScore,
      });
    }

    return trainingData;
  }

  _generateRandomContext() {
    const { vocabularies } = config;

    const sessionDuration = 60 + Math.floor(Math.random() * 60);
    const currentMinutes = Math.floor(Math.random() * sessionDuration * 0.8);

    const numGoals = 1 + Math.floor(Math.random() * 3);
    const shuffledGoals = [...vocabularies.goals].sort(() => Math.random() - 0.5);
    const selectedGoals = shuffledGoals.slice(0, numGoals);

    return {
      intensity:
        vocabularies.intensities[Math.floor(Math.random() * vocabularies.intensities.length)],
      sessionPhase:
        vocabularies.sessionPhases[Math.floor(Math.random() * vocabularies.sessionPhases.length)],
      position: vocabularies.positions[Math.floor(Math.random() * vocabularies.positions.length)],
      sessionDurationMinutes: sessionDuration,
      currentSessionMinutes: currentMinutes,
      remainingMinutes: sessionDuration - currentMinutes,
      exercisesInSession: Math.floor(Math.random() * 10),
      typesUsedCount: Math.floor(Math.random() * 5),
      targetExerciseCount: 4 + Math.floor(Math.random() * 8),
      goals: selectedGoals,
    };
  }

  prepareTrainingTensors(trainingData) {
    const contextFeatures = [];
    const exerciseFeatures = [];
    const exerciseIds = [];
    const labels = [];

    for (const sample of trainingData) {
      contextFeatures.push(this.model.encodeContextFeatures(sample.context));
      exerciseFeatures.push(this.model.encodeExerciseFeatures(sample.exercise));
      exerciseIds.push([this.model.getExerciseIdIndex(sample.exercise.id)]);
      labels.push([sample.label]);
    }

    return {
      contextTensor: tf.tensor2d(contextFeatures),
      exerciseFeaturesTensor: tf.tensor2d(exerciseFeatures),
      exerciseIdTensor: tf.tensor2d(exerciseIds, [trainingData.length, 1], 'int32'),
      labelsTensor: tf.tensor2d(labels),
    };
  }

  async train(trainingData, options = {}) {
    const {
      epochs = config.training.epochs,
      batchSize = config.training.batchSize,
      validationSplit = config.training.validationSplit,
      callbacks = [],
    } = options;

    console.log(`Starting training with ${trainingData.length} samples...`);

    const tensors = this.prepareTrainingTensors(trainingData);

    const earlyStopping = tf.callbacks.earlyStopping({
      monitor: 'val_loss',
      patience: config.training.earlyStoppingPatience,
      verbose: 1,
    });

    // Custom callback para logging usando la clase CustomCallback de tfjs
    const loggingCallback = new tf.CustomCallback({
      onEpochEnd: async (epoch, logs) => {
        console.log(
          `Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}`
        );
        this.trainingHistory.push({
          epoch: epoch + 1,
          loss: logs.loss,
          val_loss: logs.val_loss,
          mse: logs.mse,
          val_mse: logs.val_mse,
        });
      },
    });

    try {
      const history = await this.model.rankingModel.fit(
        [tensors.contextTensor, tensors.exerciseFeaturesTensor, tensors.exerciseIdTensor],
        tensors.labelsTensor,
        {
          epochs,
          batchSize,
          validationSplit,
          shuffle: true,
          callbacks: [earlyStopping, loggingCallback, ...callbacks],
        }
      );

      this.model.isTrained = true;
      console.log('Training completed successfully');

      return {
        history: history.history,
        finalLoss: history.history.loss[history.history.loss.length - 1],
        finalValLoss: history.history.val_loss[history.history.val_loss.length - 1],
      };
    } finally {
      tensors.contextTensor.dispose();
      tensors.exerciseFeaturesTensor.dispose();
      tensors.exerciseIdTensor.dispose();
      tensors.labelsTensor.dispose();
    }
  }

  async trainWithFeedback(feedbackData, exercises) {
    const trainingData = feedbackData
      .map((feedback) => {
        const exercise = exercises.find((e) => e.id === feedback.exercise_id);
        if (!exercise) return null;

        return {
          context: this._feedbackToContext(feedback),
          exercise,
          label: this._feedbackToScore(feedback),
        };
      })
      .filter((d) => d !== null);

    if (trainingData.length < 10) {
      console.log('Not enough feedback data for training. Need at least 10 samples.');
      return null;
    }

    return this.train(trainingData, { epochs: 20 });
  }

  _feedbackToContext(feedback) {
    return {
      intensity: feedback.intensity || 'medium',
      sessionPhase: feedback.session_phase || 'technical',
      position: feedback.position || 'unknown',
      sessionDurationMinutes: feedback.session_duration || 60,
      currentSessionMinutes: feedback.current_minutes || 0,
      remainingMinutes: feedback.remaining_minutes || 60,
      exercisesInSession: feedback.exercises_count || 0,
      typesUsedCount: feedback.types_count || 0,
      targetExerciseCount: feedback.target_count || 6,
      goals: feedback.goals || [],
    };
  }

  _feedbackToScore(feedback) {
    const rating = feedback.rating || 3;
    return (rating - 1) / 4;
  }

  async evaluate(testData) {
    const tensors = this.prepareTrainingTensors(testData);

    try {
      const result = await this.model.rankingModel.evaluate(
        [tensors.contextTensor, tensors.exerciseFeaturesTensor, tensors.exerciseIdTensor],
        tensors.labelsTensor
      );

      const metrics = {
        loss: (await result[0].data())[0],
        mse: (await result[1].data())[0],
        mae: (await result[2].data())[0],
      };

      result.forEach((t) => t.dispose());
      return metrics;
    } finally {
      tensors.contextTensor.dispose();
      tensors.exerciseFeaturesTensor.dispose();
      tensors.exerciseIdTensor.dispose();
      tensors.labelsTensor.dispose();
    }
  }

  getTrainingHistory() {
    return this.trainingHistory;
  }
}

/**
 * Scorer heurístico para warm start y comparación
 *
 * Sistema de puntuación basado en reglas predefinidas que puntúa la adecuación
 * de un ejercicio para un contexto de entrenamiento específico.
 *
 * Cada criterio parte de una puntuación base de 0.5 y se ajusta hacia arriba
 * o abajo según las reglas específicas de cada uno.
 *
 * Pesos de los criterios:
 * - Etiquetas: 30% (coincidencia de etiquetas con objetivo)
 * - Tipos: 20% (tipo de ejercicio apropiado)
 * - Dificultad: 15% (dificultad apropiada a la intensidad)
 * - Fase de sesión: 20% (adecuación a la fase de la sesión)
 * - Variedad: 10% (evitar demasiados ejercicios del mismo tipo)
 * - Único: 5% (evitar repetir ejercicios en la sesión)
 */
class HeuristicScorer {
  constructor() {
    this.weights = config.weights;
  }

  calculateScore(context, exercise) {
    const tagScore = this._calculateTagMatchScore(context, exercise);
    const typeScore = this._calculateTypeMatchScore(context, exercise);
    const difficultyScore = this._calculateDifficultyFitScore(context, exercise);
    const sessionPhaseScore = this._calculateSessionPhaseFitScore(context, exercise);
    const varietyScore = this._calculateVarietyScore(context, exercise);
    const uniquenessScore = this._calculateUniquenessScore(context, exercise);

    const totalScore =
      tagScore * this.weights.tagMatch +
      typeScore * this.weights.typeMatch +
      difficultyScore * this.weights.difficultyFit +
      sessionPhaseScore * this.weights.sessionPhaseFit +
      varietyScore * this.weights.typeVariety +
      uniquenessScore * this.weights.uniqueness;

    return Math.min(1, Math.max(0, totalScore));
  }

  _calculateTagMatchScore(context, exercise) {
    const BASE_SCORE = 0.5;
    const MATCH_BONUS = 0.05;

    // Sin objetivos específicos -> puntuación base neutral
    if (!context.goals || context.goals.length === 0) return BASE_SCORE;
    // Ejercicio sin etiquetas -> puntuación base (no puede coincidir)
    if (!exercise.etiquetas || exercise.etiquetas.length === 0) return BASE_SCORE;

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

    // Base + (coincidencias × bonus), limitado a 1.0
    return Math.min(1, BASE_SCORE + matchCount * MATCH_BONUS);
  }

  /**
   * Coincidencia del tipo de ejercicio con los objetivos de la planificación
   *
   * Base: 0.5
   * Si el tipo del ejercicio se ajusta al objetivo: +0.15
   */
  _calculateTypeMatchScore(context, exercise) {
    const BASE_SCORE = 0.5;
    const TYPE_MATCH_BONUS = 0.15;

    // Sin objetivos específicos → puntuación base neutral
    if (!context.goals || context.goals.length === 0) return BASE_SCORE;
    // Ejercicio sin tipo → puntuación base
    if (!exercise.tipo) return BASE_SCORE;

    const exerciseType = exercise.tipo.toUpperCase();

    for (const goal of context.goals) {
      const relevantTypes = config.goalToTypes[goal.toLowerCase()] || [];
      if (relevantTypes.includes(exerciseType)) {
        // Tipo coincide con objetivo → base + bonus
        return BASE_SCORE + TYPE_MATCH_BONUS;
      }
    }

    // Tipo no coincide → puntuación base
    return BASE_SCORE;
  }

  /**
   * Ajuste a la intensidad de la planificación propuesta
   *
   * Base: 0.5
   * Se define un rango de dificultad ideal para cada nivel de intensidad:
   * - Low: [1, 3]
   * - Medium: [2, 4]
   * - High: [3, 5]
   *
   * Si la dificultad media está dentro del rango: sin ajuste (0.5)
   * Si está fuera: -0.05 por cada nivel de diferencia
   */
  _calculateDifficultyFitScore(context, exercise) {
    const BASE_SCORE = 0.5;
    const PENALTY_PER_LEVEL = 0.05;

    // Helper para obtener dificultad en formato plano o anidado
    const getDifficulty = (type) => {
      if (exercise[`dificultad_${type}`] !== undefined) {
        return exercise[`dificultad_${type}`];
      }
      if (exercise.dificultad && exercise.dificultad[type] !== undefined) {
        return exercise.dificultad[type];
      }
      return 3; // Valor por defecto
    };

    // Calcular dificultad media del ejercicio
    const avgDifficulty =
      (getDifficulty('tactica') +
        getDifficulty('tecnica') +
        getDifficulty('fisica') +
        getDifficulty('mental')) /
      4;

    // Obtener rango de dificultad según intensidad
    const intensity = context.intensity || 'medium';
    const difficultyRange =
      config.intensityToDifficulty[intensity.toLowerCase()] || config.intensityToDifficulty.medium;

    // Si está dentro del rango, no se ajusta
    if (avgDifficulty >= difficultyRange.min && avgDifficulty <= difficultyRange.max) {
      return BASE_SCORE;
    }

    // Calcular distancia fuera del rango
    let distance;
    if (avgDifficulty < difficultyRange.min) {
      distance = difficultyRange.min - avgDifficulty;
    } else {
      distance = avgDifficulty - difficultyRange.max;
    }

    // Penalizar por cada nivel de diferencia
    const penalty = distance * PENALTY_PER_LEVEL;
    return Math.max(0, BASE_SCORE - penalty);
  }

  /**
   * Adecuación del tipo de ejercicio a la fase de la sesión
   *
   * Base: 0.5
   * Reglas específicas por fase:
   *
   * Calentamiento:
   *   +0.3 si tipo adecuado, -0.1 si no
   *   +0.1 si dificultad física ≤ 2
   *   -0.1 × (dif_fisica - 3) si dificultad física > 3
   *
   * Técnica:
   *   +0.3 si tipo adecuado, -0.1 si no
   *   +0.1 × (dif_tecnica - 2) si dificultad técnica ≥ 3
   *
   * Táctica:
   *   +0.3 si tipo adecuado, -0.1 si no
   *   +0.1 × (dif_tactica - 2) si dificultad táctica ≥ 3
   *
   * Acondicionamiento:
   *   +0.3 si tipo adecuado, -0.1 si no
   *   +0.15 × (dif_fisica - 3) si dificultad física ≥ 4
   *
   * Recuperación:
   *   +0.3 si tipo adecuado, -0.1 si no
   *   +0.2 si dificultad física ≤ 2
   *   -0.15 × (dif_fisica - 2) si dificultad física > 2
   */
  _calculateSessionPhaseFitScore(context, exercise) {
    const BASE_SCORE = 0.5;
    const TYPE_MATCH_BONUS = 0.3;
    const TYPE_MISMATCH_PENALTY = 0.1;

    const sessionPhase = context.sessionPhase || 'technical';
    const exerciseType = exercise.tipo?.toUpperCase();

    if (!exerciseType) return BASE_SCORE;

    // Helper para obtener dificultad
    const getDifficulty = (type) => {
      if (exercise[`dificultad_${type}`] !== undefined) {
        return exercise[`dificultad_${type}`];
      }
      if (exercise.dificultad && exercise.dificultad[type] !== undefined) {
        return exercise.dificultad[type];
      }
      return 3;
    };

    const physicDifficulty = getDifficulty('fisica');
    const technicDifficulty = getDifficulty('tecnica');
    const tacticDifficulty = getDifficulty('tactica');

    // Obtener tipos apropiados para esta fase
    const appropriateTypes = config.sessionPhaseTypes[sessionPhase] || [];
    const isTypeAppropriate = appropriateTypes.includes(exerciseType);

    let score = BASE_SCORE;

    // Aplicar bonus/penalización por tipo
    if (isTypeAppropriate) {
      score += TYPE_MATCH_BONUS;
    } else {
      score -= TYPE_MISMATCH_PENALTY;
    }

    // Aplicar reglas específicas por fase
    switch (sessionPhase) {
      case 'warmup':
        if (physicDifficulty <= 2) {
          score += 0.1;
        }
        if (physicDifficulty > 3) {
          score -= 0.1 * (physicDifficulty - 3);
        }
        break;

      case 'technical':
        if (technicDifficulty >= 3) {
          score += 0.1 * (technicDifficulty - 2);
        }
        break;

      case 'tactical':
        if (tacticDifficulty >= 3) {
          score += 0.1 * (tacticDifficulty - 2);
        }
        break;

      case 'conditioning':
        if (physicDifficulty >= 4) {
          score += 0.15 * (physicDifficulty - 3);
        }
        break;

      case 'recovery':
        if (physicDifficulty <= 2) {
          score += 0.2;
        }
        if (physicDifficulty > 2) {
          score -= 0.15 * (physicDifficulty - 2);
        }
        break;
    }

    // Limitar al rango [0, 1]
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Variedad de tipos en la sesión
   *
   * Evitar demasiados ejercicios del mismo tipo:
   * - 1er ejercicio de un tipo: 1.0
   * - 2do ejercicio: 0.75
   * - 3er ejercicio: 0.5
   * - 4to ejercicio: 0.25
   * - 5to+: 0.0
   */
  _calculateVarietyScore(context, exercise) {
    if (!context.typesUsed || context.typesUsed.length === 0) return 1.0;

    const typeCount = context.typesUsed.filter((t) => t === exercise.tipo).length;

    switch (typeCount) {
      case 0:
        return 1.0; // 1er uso
      case 1:
        return 0.75; // 2do uso
      case 2:
        return 0.5; // 3er uso
      case 3:
        return 0.25; // 4to uso
      default:
        return 0.0; // 5to+
    }
  }

  /**
   * Unicidad del ejercicio en la sesión
   *
   * Evitar repetir ejercicios:
   * - Primera aparición: 1.0
   * - Segunda aparición: 0.5
   * - Tercera+: 0.0
   */
  _calculateUniquenessScore(context, exercise) {
    if (!context.usedExerciseIds || context.usedExerciseIds.length === 0) return 1.0;

    const usageCount = context.usedExerciseIds.filter((id) => id === exercise.id).length;

    switch (usageCount) {
      case 0:
        return 1.0; // Primera aparición
      case 1:
        return 0.5; // Segunda aparición
      default:
        return 0.0; // Tercera+
    }
  }
}

module.exports = { TFRSTrainer, HeuristicScorer };
