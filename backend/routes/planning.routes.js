const express = require('express');
const router = express.Router();

const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
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

router.use(authenticateToken);

router.post(
  '/generate/individual',
  authorizeRoles('admin', 'technical_director', 'coach'),
  validate({ body: individualGenerateSchema }),
  generateIndividual
);

router.post(
  '/generate/group',
  authorizeRoles('admin', 'technical_director', 'coach'),
  validate({ body: groupGenerateSchema }),
  generateGroup
);

router.get(
  '/:id/versions',
  authorizeRoles('admin', 'technical_director', 'coach'),
  validate({
    params: Joi.object({ id: Joi.number().integer().positive().required() }),
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      pageSize: Joi.number().integer().min(1).max(100).default(10),
    }).unknown(true),
  }),
  listVersions
);

router.get(
  '/:id/versions/:versionId/export',
  authorizeRoles('admin', 'technical_director', 'coach'),
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
