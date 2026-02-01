const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { createTrainingPlanSchema, updateTrainingPlanSchema } = require('../src/validation/trainingPlanSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listTrainingPlans, getTrainingPlan, createTrainingPlan, updateTrainingPlan, deleteTrainingPlan } = require('../src/controllers/trainingPlanController');
const { individualGenerateSchema, groupGenerateSchema } = require('../src/validation/planningGenerationSchemas');
const { generateIndividual, generateGroup } = require('../src/controllers/planningGenerationController');
const { listVersions, exportVersion } = require('../src/controllers/planningVersionsController');

router.use(requireAuth);

// ==================== /training-plans ====================
// GET  /training-plans - CU.023/024/027: Listar planes - todos autenticados
router.get('/', listTrainingPlans);
// POST /training-plans - CU.023/024: Crear planes - admin, technical_director, coach
router.post('/', requireAnyRole('admin', 'technical_director', 'coach'), validate({ body: createTrainingPlanSchema }), createTrainingPlan);

// ==================== /training-plans/generate/individual ====================
// POST /training-plans/generate/individual - CU.023: Generar plan individual - admin, technical_director, coach
router.post(
  '/generate/individual',
  requireAnyRole('admin', 'technical_director', 'coach'),
  validate({ body: individualGenerateSchema }),
  generateIndividual
);

// ==================== /training-plans/generate/group ====================
// POST /training-plans/generate/group - CU.024: Generar plan grupal - admin, technical_director, coach
router.post(
  '/generate/group',
  requireAnyRole('admin', 'technical_director', 'coach'),
  validate({ body: groupGenerateSchema }),
  generateGroup
);

// ==================== /training-plans/:id ====================
// GET    /training-plans/:id - CU.023/024/027: Ver plan
router.get('/:id', validate({ params: idParamSchema }), getTrainingPlan);
// PUT    /training-plans/:id - CU.025: Editar planes - admin, technical_director, coach
router.put('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema, body: updateTrainingPlanSchema }), updateTrainingPlan);
// DELETE /training-plans/:id - CU.026: Eliminar planes - admin, technical_director, coach
router.delete('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema }), deleteTrainingPlan);

// ==================== /training-plans/:id/versions/:versionId/export ====================
// GET /training-plans/:id/versions/:versionId/export - CU.027: Exportar versión - admin, technical_director, coach, player (propio)
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
