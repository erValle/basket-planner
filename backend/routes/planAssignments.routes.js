const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole, requireSelfOrRoles } = require('../src/middlewares/rbac');
const {
  createPlanAssignmentSchema,
  updatePlanAssignmentSchema,
} = require('../src/validation/planAssignmentSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const {
  listAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  listAssignmentsForUser,
  listAssignmentsForPlan,
} = require('../src/controllers/planAssignmentController');

router.use(requireAuth);

// ==================== /plan-assignments ====================
// GET  /plan-assignments - Listar asignaciones - todos autenticados (jugadores solo las suyas)
router.get('/', listAssignments);
// POST /plan-assignments - Crear asignación - Director Técnico y Entrenador
router.post(
  '/',
  requireAnyRole('technical_director', 'coach'),
  validate({ body: createPlanAssignmentSchema }),
  createAssignment
);

// ==================== /plan-assignments/user/:userId ====================
// GET /plan-assignments/user/:userId - Ver asignaciones de usuario - propio o technical_director/coach
// NOTA: Rutas específicas deben ir ANTES de las genéricas /:id
router.get(
  '/user/:userId',
  requireSelfOrRoles('userId', 'technical_director', 'coach'),
  listAssignmentsForUser
);

// ==================== /plan-assignments/training-plan/:trainingPlanId ====================
// GET /plan-assignments/training-plan/:trainingPlanId - Ver asignaciones de plan - technical_director, coach
router.get(
  '/training-plan/:trainingPlanId',
  requireAnyRole('technical_director', 'coach'),
  listAssignmentsForPlan
);

// ==================== /plan-assignments/:id ====================
// GET    /plan-assignments/:id - Ver asignación (todos autenticados)
router.get('/:id', validate({ params: idParamSchema }), getAssignment);
// PUT    /plan-assignments/:id - Editar asignación - Director Técnico y Entrenador
router.put(
  '/:id',
  requireAnyRole('technical_director', 'coach'),
  validate({ params: idParamSchema, body: updatePlanAssignmentSchema }),
  updateAssignment
);
// DELETE /plan-assignments/:id - Eliminar asignación - Director Técnico y Entrenador
router.delete(
  '/:id',
  requireAnyRole('technical_director', 'coach'),
  validate({ params: idParamSchema }),
  deleteAssignment
);

module.exports = router;
