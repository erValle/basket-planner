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

router.get('/status', (req, res) => {
  const modelInfo = getModelInfo();
  const active = state.versions.find((v) => v.id === state.activeVersion);
  
  res.json({
    activeVersion: state.activeVersion,
    modelInfo,
    trainedAt: active?.trainedAt ?? null,
    metrics: active?.metrics ?? null,
    techCost: active?.techCost ?? 'low',
  });
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
