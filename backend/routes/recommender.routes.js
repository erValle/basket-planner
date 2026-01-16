const express = require('express');
const router = express.Router();

const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { getModelInfo, getModelConfig, listAvailableModels } = require('../src/recommender/modelManager');

// CU.028: Solo admin puede acceder al sistema recomendador
router.use(requireAuth);
router.use(requireAnyRole('admin'));

// Minimal in-memory recommender state to back the frontend screens.
// Later: replace with real ML job runner + DB.
const state = {
  activeVersion: 'rec-0.1.0-baseline',
  versions: [
    {
      id: 'rec-0.1.0-baseline',
      createdAt: new Date().toISOString().slice(0, 10),
      trainedAt: new Date().toISOString(),
      algorithm: 'rule-based-heuristic',
      metrics: { accuracy: 0, coverage: 1.0, latencyMs: 50 },
      techCost: 'low',
      isActive: true,
    },
  ],
  jobs: {},
};

router.get('/status', async (req, res) => {
  try {
    const modelInfo = getModelInfo();
    const config = getModelConfig();
    const { TrainingPlan, Exercise, TrainingPlanVersion, sequelize } = require('../models');
    
    // Obtener estadísticas reales del sistema
    const totalPlans = await TrainingPlan.count();
    const totalExercises = await Exercise.count();
    
    // Obtener versiones de planes con sesiones para análisis
    const versionsWithSessions = await TrainingPlanVersion.findAll({
      where: {
        sessions: { [sequelize.Sequelize.Op.ne]: null }
      },
      attributes: ['id', 'sessions'],
      limit: 100
    });
    
    // Contar ejercicios por nombre en las planificaciones
    const exerciseCounts = {};
    versionsWithSessions.forEach(version => {
      const sessions = version.sessions?.sessions || [];
      sessions.forEach(session => {
        const blocks = session.blocks || [];
        blocks.forEach(block => {
          const exercises = block.exercises || [];
          exercises.forEach(ex => {
            const name = ex.name || 'Sin nombre';
            exerciseCounts[name] = (exerciseCounts[name] || 0) + 1;
          });
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
        usageCount: count
      }));
    
    // Obtener objetivos más populares en planificaciones
    const plansWithGoals = await TrainingPlan.findAll({
      where: {
        goal: { [sequelize.Sequelize.Op.ne]: null }
      },
      attributes: ['goal']
    });
    
    // Contar objetivos
    const goalCounts = {};
    plansWithGoals.forEach(plan => {
      if (plan.goal) {
        goalCounts[plan.goal] = (goalCounts[plan.goal] || 0) + 1;
      }
    });
    
    const topGoals = Object.entries(goalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([goal, count]) => ({
        goal: goal,
        count: count
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
      trainedAt: new Date().toISOString(),
      techCost: 'low',
    });
  } catch (error) {
    console.error('Error getting recommender status:', error);
    res.status(500).json({ message: 'Error al obtener estado del recomendador', error: error.message });
  }
});

// Nuevo endpoint: obtener configuración del modelo activo
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
      intensityMultiplier: config.intensityMultiplier
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener configuración del modelo', error: error.message });
  }
});

// Nuevo endpoint: listar modelos disponibles
router.get('/models', (req, res) => {
  try {
    const models = listAvailableModels();
    res.json({ items: models });
  } catch (error) {
    res.status(500).json({ message: 'Error al listar modelos', error: error.message });
  }
});

router.post('/train', (req, res) => {
  const jobId = `job-${Math.random().toString(16).slice(2, 10)}`;

  state.jobs[jobId] = {
    id: jobId,
    status: 'SUCCESS',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    logs: 'Placeholder training job (no-op). El modelo baseline no es reentrenable.',
    resultVersionId: state.activeVersion,
  };

  res.json({ jobId });
});

router.get('/jobs/:jobId', (req, res) => {
  const job = state.jobs[req.params.jobId];
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json(job);
});

router.get('/versions', (req, res) => {
  res.json({ items: state.versions });
});

router.post('/versions/:versionId/activate', (req, res) => {
  const versionId = req.params.versionId;
  const found = state.versions.find((v) => v.id === versionId);
  if (!found) return res.status(404).json({ message: 'Version not found' });

  state.activeVersion = versionId;
  state.versions = state.versions.map((v) => ({ ...v, isActive: v.id === versionId }));
  res.json({ ok: true });
});

// Nuevo endpoint: sugerir objetivos/etiquetas para planificaciones
router.post('/suggest-goals', (req, res) => {
  try {
    const config = getModelConfig();
    const { context } = req.body;
    
    // Obtener todos los objetivos disponibles del config
    const availableGoals = Object.keys(config.goalToTags);
    
    // Si hay contexto (nivel, intensidad, duración), podemos personalizar las sugerencias
    const playerLevel = context?.playerLevel || 'intermediate';
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
        reason: intensity === 'high' ? 'Intensidad alta requiere buen acondicionamiento' : 'Importante para el rendimiento sostenido',
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
    
    // Filtrar según el nivel del jugador
    let filtered = suggestions;
    if (playerLevel === 'beginner') {
      // Para principiantes, priorizar fundamentos básicos
      filtered = suggestions.map(s => {
        if (['shooting', 'ball_handling', 'fundamentals'].includes(s.goal)) {
          return { ...s, priority: 'high' };
        }
        return s;
      });
    } else if (playerLevel === 'advanced') {
      // Para avanzados, priorizar aspectos tácticos y específicos
      filtered = suggestions.map(s => {
        if (['tactics', 'pick_and_roll', 'transition'].includes(s.goal)) {
          return { ...s, priority: 'high' };
        }
        return s;
      });
    }
    
    // Ordenar por prioridad
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    res.json({
      suggestions: filtered.slice(0, 5), // Top 5 sugerencias
      allAvailableGoals: availableGoals,
      modelVersion: config.modelVersion,
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al generar sugerencias de objetivos', 
      error: error.message 
    });
  }
});

module.exports = router;
