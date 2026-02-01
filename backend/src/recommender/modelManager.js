/**
 * Gestor del Motor de Recomendación
 * 
 * Provee acceso al modelo TFRS de recomendación.
 */

const recommender = require('./recommender');
const config = require('./config');

/**
 * Obtiene el modelo activo
 * @returns {Object} Motor de recomendación
 */
function getActiveModel() {
  return recommender;
}

/**
 * Obtiene la información del modelo
 * @returns {Object} Información del modelo
 */
function getModelInfo() {
  return recommender.getModelInfo();
}

/**
 * Obtiene la configuración del modelo
 * @returns {Object} Configuración completa
 */
function getModelConfig() {
  return config;
}

/**
 * Lista los modelos disponibles
 * @returns {Array<Object>} Lista de modelos (solo TFRS)
 */
function listAvailableModels() {
  const info = recommender.getModelInfo();
  return [
    {
      key: config.modelVersion,
      version: config.modelVersion,
      description: config.description,
      createdAt: config.createdAt,
      isActive: true,
      type: 'tensorflow-hybrid',
      isTrained: info.isTrained,
      isInitialized: info.isInitialized
    }
  ];
}

module.exports = {
  getActiveModel,
  getModelInfo,
  getModelConfig,
  listAvailableModels
};
