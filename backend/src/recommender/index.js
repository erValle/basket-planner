/**
 * Motor de Recomendación TFRS - Índice Principal
 * 
 * Este módulo exporta todas las funcionalidades del motor de recomendación
 * basado en TensorFlow Recommenders.
 */

const recommender = require('./recommender');
const config = require('./config');
const TFRSRankingModel = require('./tfrsModel');
const { 
  TFRSExerciseScorer,
  scoreExercise,
  scoreTagMatch,
  scoreTypeMatch,
  scoreDifficultyFit,
  scoreTypeVariety,
  scoreUniqueness,
  getDimensionWeights
} = require('./exerciseScorer');
const { TFRSTrainer, HeuristicScorer } = require('./trainer');
const { 
  filterExercises, 
  filterBySessionPhase, 
  normalizeMaterial,
  hasMaterialsAvailable
} = require('./exerciseFilter');

module.exports = {
  // API principal del recomendador
  initializeModel: recommender.initializeModel,
  generateSession: recommender.generateSession,
  generatePlan: recommender.generatePlan,
  deriveRelevantTags: recommender.deriveRelevantTags,
  derivePreferredTypes: recommender.derivePreferredTypes,
  warmStartTraining: recommender.warmStartTraining,
  trainWithFeedback: recommender.trainWithFeedback,
  getModelInfo: recommender.getModelInfo,
  getModelConfig: recommender.getModelConfig,
  
  // Configuración
  config,
  
  // Modelo TensorFlow
  TFRSRankingModel,
  
  // Scoring
  TFRSExerciseScorer,
  HeuristicScorer,
  scoreExercise,
  scoreTagMatch,
  scoreTypeMatch,
  scoreDifficultyFit,
  scoreTypeVariety,
  scoreUniqueness,
  getDimensionWeights,
  
  // Entrenamiento
  TFRSTrainer,
  
  // Filtrado
  filterExercises,
  filterBySessionPhase,
  normalizeMaterial,
  hasMaterialsAvailable,
  
  // Metadata
  modelVersion: config.modelVersion,
  modelDescription: config.description
};
