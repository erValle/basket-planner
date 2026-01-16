/**
 * Punto de entrada principal del modelo de recomendación
 * Exporta el modelo activo configurado
 */

const recommender = require('./recommender');
const config = require('./config');
const exerciseScorer = require('./exerciseScorer');
const exerciseFilter = require('./exerciseFilter');

module.exports = {
  ...recommender,
  config,
  scorer: exerciseScorer,
  filter: exerciseFilter
};
