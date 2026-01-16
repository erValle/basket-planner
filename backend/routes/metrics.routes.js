const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { createMetricSchema } = require('../src/validation/metricSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listMetrics, getMetric, createMetric, updateMetric, deleteMetric } = require('../src/controllers/metricController');

router.use(requireAuth);

router.get('/', requireAnyRole('admin', 'technical_director'), listMetrics);
router.get('/:id', requireAnyRole('admin', 'technical_director'), validate({ params: idParamSchema }), getMetric);
router.post('/', requireAnyRole('admin', 'technical_director'), validate({ body: createMetricSchema }), createMetric);
router.put('/:id', requireAnyRole('admin', 'technical_director'), validate({ params: idParamSchema, body: createMetricSchema }), updateMetric);
router.delete('/:id', requireAnyRole('admin', 'technical_director'), validate({ params: idParamSchema }), deleteMetric);

module.exports = router;
