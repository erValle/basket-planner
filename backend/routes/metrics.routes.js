const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const { createMetricSchema } = require('../src/validation/metricSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listMetrics, getMetric, createMetric, deleteMetric } = require('../src/controllers/metricController');

router.use(authenticateToken);

router.get('/', authorizeRoles('admin','technical_director'), listMetrics);
router.get('/:id', authorizeRoles('admin','technical_director'), validate({ params: idParamSchema }), getMetric);
router.post('/', authorizeRoles('admin','technical_director'), validate({ body: createMetricSchema }), createMetric);
router.delete('/:id', authorizeRoles('admin','technical_director'), validate({ params: idParamSchema }), deleteMetric);

module.exports = router;
