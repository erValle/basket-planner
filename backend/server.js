require('dotenv').config();

const app = require('./app');
const logger = require('./src/middlewares/logger');
const recommender = require('./src/recommender');
const { getAllExercisesForRecommender } = require('./src/services/exerciseService');

const SERVER_PORT = process.env.SERVER_PORT || 4000;

/**
 * Inicializa el modelo de recomendación al arrancar el servidor
 */
async function initializeRecommenderModel() {
  try {
    logger.info('Inicializando modelo de recomendación...');

    // Obtener ejercicios para inicializar vocabularios
    const exercises = await getAllExercisesForRecommender({ active: true });
    logger.info(`${exercises.length} ejercicios cargados para el modelo`);

    // Inicializar el modelo (carga el pre-entrenado si existe)
    await recommender.initializeModel(exercises, true);

    const modelInfo = recommender.getModelInfo();
    if (modelInfo.isTrained) {
      logger.info('Modelo neuronal TFRS cargado correctamente (modo híbrido 70/30)');
    } else {
      logger.warn('Modelo no entrenado, usando solo heurístico');
    }
  } catch (error) {
    logger.error('Error inicializando modelo de recomendación:', error.message);
    logger.warn('El sistema funcionará en modo heurístico');
  }
}

app.listen(SERVER_PORT, async () => {
  logger.info(`Server is running on port ${SERVER_PORT}`);

  // Inicializar el modelo de recomendación después de que el servidor arranque
  await initializeRecommenderModel();
});
