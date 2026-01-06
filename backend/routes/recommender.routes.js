const express = require('express');
const router = express.Router();

const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const { getModelInfo, getModelConfig, listAvailableModels } = require('../src/recommender/modelManager');

router.use(authenticateToken);
router.use(authorizeRoles('admin', 'technical_director', 'coach'));

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

module.exports = router;
