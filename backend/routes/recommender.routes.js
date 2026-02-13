const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const {
  getModelInfo,
  getModelConfig,
  listAvailableModels,
} = require('../src/recommender/modelManager');

// Solo admin puede acceder al sistema recomendador
router.use(requireAuth);
router.use(requireAnyRole('admin'));

// Helper para cargar metadata de entrenamiento
function loadTrainingMetadata() {
  try {
    const metadataPath = path.join(
      __dirname,
      '..',
      'src',
      'recommender',
      'saved_model',
      'training_metadata.json'
    );
    if (fs.existsSync(metadataPath)) {
      return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    }
  } catch (error) {
    console.warn('Could not load training metadata:', error.message);
  }
  return null;
}

// Minimal in-memory recommender state to back the frontend screens.
// Later: replace with real ML job runner + DB.
const state = {
  activeVersion: '1.0.0-tfrs',
  versions: [
    {
      id: '1.0.0-tfrs',
      createdAt: new Date().toISOString().slice(0, 10),
      trainedAt: new Date().toISOString(),
      algorithm: 'tensorflow-two-tower',
      metrics: { accuracy: 0, coverage: 1.0, latencyMs: 100 },
      techCost: 'medium',
      isActive: true,
    },
  ],
  jobs: {},
};

// GET /config - Obtener configuración del modelo activo
router.get('/config', (req, res) => {
  try {
    const config = getModelConfig();
    res.json({
      version: config.modelVersion,
      description: config.description,
      createdAt: config.createdAt,
      weights: config.weights,
      goalToTags: config.goalToTags,
      goalToTypes: config.goalToTypes,
      sessionTypeDistribution: config.sessionTypeDistribution,
      levelToDifficulty: config.levelToDifficulty,
      intensityMultiplier: config.intensityMultiplier,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error al obtener configuración del modelo', error: error.message });
  }
});

// GET /jobs/:jobId - Obtener estado de un job de entrenamiento
router.get('/jobs/:jobId', (req, res) => {
  const job = state.jobs[req.params.jobId];
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json(job);
});

// GET /models - Listar modelos disponibles
router.get('/models', (req, res) => {
  try {
    const models = listAvailableModels();
    res.json({ items: models });
  } catch (error) {
    res.status(500).json({ message: 'Error al listar modelos', error: error.message });
  }
});

// GET /status - Obtener estado completo del sistema recomendador
router.get('/status', async (req, res) => {
  try {
    const modelInfo = getModelInfo();
    const config = getModelConfig();
    const { TrainingPlan, Exercise, TrainingPlanVersion, sequelize } = require('../models');

    // Medir tiempo de inicio para calcular latencia de la consulta
    const queryStartTime = process.hrtime();

    // Obtener estadísticas reales del sistema
    const totalPlans = await TrainingPlan.count();
    const totalExercises = await Exercise.count();

    // Obtener versiones de planes con sesiones para análisis
    const versionsWithSessions = await TrainingPlanVersion.findAll({
      where: {
        sessions: { [sequelize.Sequelize.Op.ne]: null },
      },
      attributes: ['id', 'sessions'],
      limit: 100,
    });

    // Calcular latencia de la consulta
    const queryEndTime = process.hrtime(queryStartTime);
    const queryLatencyMs = Math.round(queryEndTime[0] * 1000 + queryEndTime[1] / 1000000);

    // Contar ejercicios por nombre en las planificaciones
    const exerciseCounts = {};
    versionsWithSessions.forEach((version) => {
      // La estructura puede ser: version.sessions (array directo) o version.sessions.sessions
      let sessions = [];
      if (Array.isArray(version.sessions)) {
        sessions = version.sessions;
      } else if (version.sessions?.sessions && Array.isArray(version.sessions.sessions)) {
        sessions = version.sessions.sessions;
      }

      sessions.forEach((session) => {
        // Los ejercicios pueden estar en session.exercises (nuevo formato) o session.blocks[].exercises (formato legacy)
        let exercises = [];

        // Nuevo formato: ejercicios directamente en la sesión
        if (Array.isArray(session.exercises)) {
          exercises = session.exercises;
        }
        // Formato legacy: ejercicios en bloques
        else if (Array.isArray(session.blocks)) {
          session.blocks.forEach((block) => {
            if (Array.isArray(block.exercises)) {
              exercises.push(...block.exercises);
            }
          });
        }

        exercises.forEach((ex) => {
          const name = ex.name || 'Sin nombre';
          exerciseCounts[name] = (exerciseCounts[name] || 0) + 1;
        });
      });
    });

    // Top 5 ejercicios más usados
    const topExercises = Object.entries(exerciseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], index) => ({
        id: index + 1,
        name: name,
        usageCount: count,
      }));

    // Obtener objetivos más populares en planificaciones
    const plansWithGoals = await TrainingPlan.findAll({
      where: {
        goal: { [sequelize.Sequelize.Op.ne]: null },
      },
      attributes: ['goal'],
    });

    // Contar objetivos
    const goalCounts = {};
    plansWithGoals.forEach((plan) => {
      if (plan.goal) {
        goalCounts[plan.goal] = (goalCounts[plan.goal] || 0) + 1;
      }
    });

    const topGoals = Object.entries(goalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([goal, count]) => ({
        goal: goal,
        count: count,
      }));

    // Construir modelConfig de forma segura
    let modelConfig = {
      version: 'unknown',
      description: 'Sin descripción',
      createdAt: new Date().toISOString(),
      totalGoals: 0,
      totalTags: 0,
    };

    if (config) {
      modelConfig.version = config.modelVersion || 'unknown';
      modelConfig.description = config.description || 'Sin descripción';
      modelConfig.createdAt = config.createdAt || new Date().toISOString();

      if (config.goalToTags && typeof config.goalToTags === 'object') {
        try {
          modelConfig.totalGoals = Object.keys(config.goalToTags).length;
        } catch (e) {
          console.error('Error counting goals:', e);
        }
      }

      // En el config, weights tiene propiedades como tagMatch, typeMatch, etc.
      // No hay un weights.tags, así que contamos las propiedades de weights
      if (config.weights && typeof config.weights === 'object') {
        try {
          modelConfig.totalTags = Object.keys(config.weights).length;
        } catch (e) {
          console.error('Error counting weight properties:', e);
        }
      }
    }

    // Metadatos de monitorización del modelo
    const memoryUsage = process.memoryUsage();
    const monitoring = {
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      },
      queryLatencyMs,
      uptime: Math.round(process.uptime()), // segundos
      nodeVersion: process.version,
      platform: process.platform,
      architecture: config?.architecture || null,
      weights: config?.weights || null,
      trainScript: 'node scripts/train-tfrs-model.js --warm-start',
    };

    // Cargar metadata del entrenamiento
    const trainingMetadata = loadTrainingMetadata();

    res.json({
      activeVersion: state.activeVersion,
      modelInfo,
      modelConfig,
      statistics: {
        totalPlans,
        totalExercises,
        topExercises: topExercises,
        topGoals: topGoals,
      },
      monitoring, // Metadatos de monitorización
      training: trainingMetadata, // Nueva sección: datos del entrenamiento
      trainedAt: trainingMetadata?.trainedAt || new Date().toISOString(),
      techCost: 'low',
    });
  } catch (error) {
    console.error('Error getting recommender status:', error);
    res
      .status(500)
      .json({ message: 'Error al obtener estado del recomendador', error: error.message });
  }
});

// GET /versions - Listar versiones del modelo
router.get('/versions', (req, res) => {
  res.json({ items: state.versions });
});

// POST /suggest-goals - Sugerir objetivos/etiquetas para planificaciones
router.post('/suggest-goals', (req, res) => {
  try {
    const config = getModelConfig();
    const { context } = req.body;

    // Obtener todos los objetivos disponibles del config
    const availableGoals = Object.keys(config.goalToTags);

    // Si hay contexto (intensidad, duración), podemos personalizar las sugerencias
    const intensity = context?.intensity || 'medium';
    const sessionDuration = context?.sessionDuration || 90;

    // Sugerencias basadas en popularidad y balance
    // Para el modelo baseline, recomendamos un mix balanceado
    const suggestions = [
      {
        goal: 'shooting',
        label: 'Mejora del tiro exterior',
        reason: 'Fundamento técnico esencial para el desarrollo individual',
        priority: 'high',
        relevantTags: config.goalToTags['shooting'] || [],
        estimatedDuration: Math.ceil(sessionDuration * 0.3),
      },
      {
        goal: 'ball_handling',
        label: 'Manejo de balón',
        reason: 'Base fundamental para el juego individual y colectivo',
        priority: 'high',
        relevantTags: config.goalToTags['ball_handling'] || [],
        estimatedDuration: Math.ceil(sessionDuration * 0.25),
      },
      {
        goal: 'defense',
        label: 'Defensa individual',
        reason: 'Aspecto clave del juego completo',
        priority: 'medium',
        relevantTags: config.goalToTags['defense'] || [],
        estimatedDuration: Math.ceil(sessionDuration * 0.2),
      },
      {
        goal: 'conditioning',
        label: 'Condición física general',
        reason:
          intensity === 'high'
            ? 'Intensidad alta requiere buen acondicionamiento'
            : 'Importante para el rendimiento sostenido',
        priority: intensity === 'high' ? 'high' : 'medium',
        relevantTags: config.goalToTags['conditioning'] || [],
        estimatedDuration: Math.ceil(sessionDuration * 0.15),
      },
      {
        goal: 'tactics',
        label: 'Táctica de equipo',
        reason: 'Mejora la comprensión del juego colectivo',
        priority: 'medium',
        relevantTags: config.goalToTags['tactics'] || [],
        estimatedDuration: Math.ceil(sessionDuration * 0.25),
      },
    ];

    // Ordenar por prioridad
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    res.json({
      suggestions: suggestions.slice(0, 5), // Top 5 sugerencias
      allAvailableGoals: availableGoals,
      modelVersion: config.modelVersion,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al generar sugerencias de objetivos',
      error: error.message,
    });
  }
});

// POST /train - Iniciar entrenamiento del modelo (simulado)
router.post('/train', (req, res) => {
  // El entrenamiento del modelo solo se realiza manualmente mediante:
  // node scripts/train-tfrs-model.js --warm-start
  // Este endpoint solo simula el proceso para mantener compatibilidad con el frontend.
  const jobId = `job-${Math.random().toString(16).slice(2, 10)}`;

  state.jobs[jobId] = {
    id: jobId,
    status: 'SUCCESS',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    logs: 'El entrenamiento del modelo se realiza manualmente mediante el script: node scripts/train-tfrs-model.js --warm-start',
    resultVersionId: state.activeVersion,
  };

  res.json({
    jobId,
    message: 'El entrenamiento se realiza manualmente. Ver scripts/train-tfrs-model.js',
  });
});

// POST /versions/:versionId/activate - Activar una versión del modelo
router.post('/versions/:versionId/activate', (req, res) => {
  const versionId = req.params.versionId;
  const found = state.versions.find((v) => v.id === versionId);
  if (!found) return res.status(404).json({ message: 'Version not found' });

  state.activeVersion = versionId;
  state.versions = state.versions.map((v) => ({ ...v, isActive: v.id === versionId }));
  res.json({ ok: true });
});

module.exports = router;
