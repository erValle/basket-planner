const express = require('express');
const router = express.Router();

const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const {
  individualGenerateSchema,
  groupGenerateSchema
} = require('../src/validation/planningGenerationSchemas');
const {
  generateIndividual,
  generateGroup
} = require('../src/controllers/planningGenerationController');
const { approveGeneratedPlan } = require('../src/controllers/planningController');
const { approveGeneratedPlanSchema } = require('../src/validation/planningApproveSchemas');
const { restoreVersion } = require('../src/controllers/trainingPlanVersionController');
const {
  restoreTrainingPlanVersionSchema,
} = require('../src/validation/trainingPlanVersionSchemas');
const Joi = require('joi');

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

router.post(
  '/approve',
  authorizeRoles('admin', 'technical_director', 'coach'),
  validate({ body: approveGeneratedPlanSchema }),
  approveGeneratedPlan
);

router.post(
  '/:id/versions/:versionId/restore',
  authorizeRoles('admin', 'technical_director', 'coach'),
  validate({
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
      versionId: Joi.number().integer().positive().required(),
    }),
    body: restoreTrainingPlanVersionSchema,
  }),
  (req, res, next) => {
    req.params.trainingPlanId = req.params.id;
    req.params.id = req.params.versionId;
    return restoreVersion(req, res, next);
  }
);

module.exports = router;
