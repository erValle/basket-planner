const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { createMetricSchema } = require('../src/validation/metricSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const {
  listMetrics,
  getMetric,
  createMetric,
  updateMetric,
  deleteMetric,
} = require('../src/controllers/metricController');

router.use(requireAuth);

// GET  /metrics - Listar métricas - admin, technical_director
router.get('/', requireAnyRole('admin', 'technical_director'), listMetrics);
// POST /metrics - Crear métrica - admin, technical_director
router.post(
  '/',
  requireAnyRole('admin', 'technical_director'),
  validate({ body: createMetricSchema }),
  createMetric
);

// GET    /metrics/:id - Ver métrica - admin, technical_director
router.get(
  '/:id',
  requireAnyRole('admin', 'technical_director'),
  validate({ params: idParamSchema }),
  getMetric
);
// PUT    /metrics/:id - Actualizar métrica - admin, technical_director
router.put(
  '/:id',
  requireAnyRole('admin', 'technical_director'),
  validate({ params: idParamSchema, body: createMetricSchema }),
  updateMetric
);
// DELETE /metrics/:id - Eliminar métrica - admin, technical_director
router.delete(
  '/:id',
  requireAnyRole('admin', 'technical_director'),
  validate({ params: idParamSchema }),
  deleteMetric
);

module.exports = router;
