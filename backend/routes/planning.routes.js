const express = require('express');
const router = express.Router();

const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const Joi = require('joi');
const {
  individualGenerateSchema,
  groupGenerateSchema
} = require('../src/validation/planningGenerationSchemas');
const {
  generateIndividual,
  generateGroup
} = require('../src/controllers/planningGenerationController');
const { listVersions, exportVersion } = require('../src/controllers/planningVersionsController');

router.use(requireAuth);

// CU.023: Generar plan individual - admin, technical_director, coach
router.post(
  '/generate/individual',
  requireAnyRole('admin', 'technical_director', 'coach'),
  validate({ body: individualGenerateSchema }),
  generateIndividual
);

// CU.024: Generar plan grupal - admin, technical_director, coach
router.post(
  '/generate/group',
  requireAnyRole('admin', 'technical_director', 'coach'),
  validate({ body: groupGenerateSchema }),
  generateGroup
);

// CU.027: Listar versiones - admin, technical_director, coach
router.get(
  '/:id/versions',
  requireAnyRole('admin', 'technical_director', 'coach'),
  validate({
    params: Joi.object({ id: Joi.number().integer().positive().required() }),
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(10),
    }).unknown(true),
  }),
  listVersions
);

// CU.027: Exportar versión - admin, technical_director, coach, player (propio)
router.get(
  '/:id/versions/:versionId/export',
  requireAnyRole('admin', 'technical_director', 'coach', 'player'),
  validate({
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
      versionId: Joi.number().integer().positive().required(),
    }),
    query: Joi.object({
      format: Joi.string().valid('csv', 'pdf').default('csv'),
    }).unknown(true),
  }),
  exportVersion
);

module.exports = router;
