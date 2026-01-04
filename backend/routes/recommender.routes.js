const express = require('express');
const router = express.Router();

const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');

router.use(authenticateToken);
router.use(authorizeRoles('admin', 'technical_director', 'coach'));

// Minimal in-memory recommender state to back the frontend screens.
// Later: replace with real ML job runner + DB.
const state = {
  activeVersion: 'rec-0.0.0',
  versions: [
    {
      id: 'rec-0.0.0',
      createdAt: new Date().toISOString().slice(0, 10),
      trainedAt: new Date().toISOString(),
      algorithm: 'placeholder',
      metrics: { accuracy: 0, coverage: 0, latencyMs: 0 },
      techCost: 'low',
      isActive: true,
    },
  ],
  jobs: {},
};

router.get('/status', (req, res) => {
  const active = state.versions.find((v) => v.id === state.activeVersion);
  res.json({
    activeVersion: state.activeVersion,
    trainedAt: active?.trainedAt ?? null,
    metrics: active?.metrics ?? null,
    techCost: active?.techCost ?? 'low',
  });
});

router.post('/train', (req, res) => {
  const jobId = `job-${Math.random().toString(16).slice(2, 10)}`;

  state.jobs[jobId] = {
    id: jobId,
    status: 'SUCCESS',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    logs: 'Placeholder training job (no-op).',
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
