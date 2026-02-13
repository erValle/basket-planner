const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const {
  createTrainingPlanSchema,
  updateTrainingPlanSchema,
} = require('../src/validation/trainingPlanSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const {
  listTrainingPlans,
  getTrainingPlan,
  createTrainingPlan,
  updateTrainingPlan,
  deleteTrainingPlan,
} = require('../src/controllers/trainingPlanController');
const {
  individualGenerateSchema,
  groupGenerateSchema,
} = require('../src/validation/planningGenerationSchemas');
const {
  generateIndividual,
  generateGroup,
} = require('../src/controllers/planningGenerationController');
const { listVersions, exportVersion } = require('../src/controllers/planningVersionsController');

router.use(requireAuth);

// GET  /training-plans - Listar planes - todos autenticados (jugadores ven solo los suyos)
router.get('/', listTrainingPlans);
// POST /training-plans - Crear planes - Director Técnico y Entrenador
router.post(
  '/',
  requireAnyRole('technical_director', 'coach'),
  validate({ body: createTrainingPlanSchema }),
  createTrainingPlan
);

// POST /training-plans/generate/individual - Generar plan individual - Director Técnico y Entrenador
router.post(
  '/generate/individual',
  requireAnyRole('technical_director', 'coach'),
  validate({ body: individualGenerateSchema }),
  generateIndividual
);

// POST /training-plans/generate/group - Generar plan grupal - Director Técnico y Entrenador
router.post(
  '/generate/group',
  requireAnyRole('technical_director', 'coach'),
  validate({ body: groupGenerateSchema }),
  generateGroup
);

// GET    /training-plans/:id - Ver plan (todos autenticados - jugadores solo los asignados)
router.get('/:id', validate({ params: idParamSchema }), getTrainingPlan);
// PUT    /training-plans/:id - Editar planes - Director Técnico y Entrenador
router.put(
  '/:id',
  requireAnyRole('technical_director', 'coach'),
  validate({ params: idParamSchema, body: updateTrainingPlanSchema }),
  updateTrainingPlan
);
// DELETE /training-plans/:id - Eliminar planes - Director Técnico y Entrenador
router.delete(
  '/:id',
  requireAnyRole('technical_director', 'coach'),
  validate({ params: idParamSchema }),
  deleteTrainingPlan
);

// GET /training-plans/:id/versions/:versionId/export - Exportar versión - technical_director, coach, player (propio)
router.get(
  '/:id/versions/:versionId/export',
  requireAnyRole('technical_director', 'coach', 'player'),
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
