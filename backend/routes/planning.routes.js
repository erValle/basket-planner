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

module.exports = router;
