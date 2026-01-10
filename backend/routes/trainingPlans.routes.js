const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { createTrainingPlanSchema, updateTrainingPlanSchema } = require('../src/validation/trainingPlanSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listTrainingPlans, getTrainingPlan, createTrainingPlan, updateTrainingPlan, deleteTrainingPlan } = require('../src/controllers/trainingPlanController');

router.use(requireAuth);

// CU.023/024/027: Listar/ver planes - todos autenticados
router.get('/', listTrainingPlans);
router.get('/:id', validate({ params: idParamSchema }), getTrainingPlan);

// CU.023/024: Crear planes - admin, technical_director, coach
router.post('/', requireAnyRole('admin', 'technical_director', 'coach'), validate({ body: createTrainingPlanSchema }), createTrainingPlan);

// CU.025: Editar planes - admin, technical_director, coach
router.put('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema, body: updateTrainingPlanSchema }), updateTrainingPlan);

// CU.026: Eliminar planes - solo admin
router.delete('/:id', requireAnyRole('admin'), validate({ params: idParamSchema }), deleteTrainingPlan);

module.exports = router;
