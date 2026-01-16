/**
 * Gestor de modelos de recomendación
 * Permite cambiar entre diferentes versiones de modelos
 */

// Modelos disponibles
const baselineModel = require('./models/rec-0.1.0-baseline');

// Configuración del modelo activo
let activeModel = baselineModel;

/**
 * Obtiene el modelo activo
 * @returns {Object} Modelo de recomendación activo
 */
function getActiveModel() {
  return activeModel;
}

/**
 * Obtiene la información del modelo activo
 * @returns {Object} Información del modelo
 */
function getModelInfo() {
  return {
    version: activeModel.config.modelVersion,
    description: activeModel.config.description,
    createdAt: activeModel.config.createdAt
  };
}

/**
 * Obtiene la configuración del modelo activo
 * @returns {Object} Configuración completa
 */
function getModelConfig() {
  return activeModel.config;
}

/**
 * Lista todos los modelos disponibles
 * @returns {Array<Object>} Lista de modelos con su información
 */
function listAvailableModels() {
  return [
    {
      version: baselineModel.config.modelVersion,
      description: baselineModel.config.description,
      createdAt: baselineModel.config.createdAt,
      isActive: activeModel === baselineModel
    }
  ];
}

module.exports = {
  getActiveModel,
  getModelInfo,
  getModelConfig,
  listAvailableModels
};
