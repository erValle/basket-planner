const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole, requireSelfOrRoles } = require('../src/middlewares/rbac');
const { createPlanAssignmentSchema, updatePlanAssignmentSchema } = require('../src/validation/planAssignmentSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listAssignments, getAssignment, createAssignment, updateAssignment, deleteAssignment, listAssignmentsForUser, listAssignmentsForPlan } = require('../src/controllers/planAssignmentController');

router.use(requireAuth);

// ==================== /plan-assignments ====================
// GET  /plan-assignments - CU.027: Listar asignaciones - todos autenticados
router.get('/', listAssignments);
// POST /plan-assignments - CU.023/024: Crear asignación - admin, technical_director, coach
router.post('/', requireAnyRole('admin', 'technical_director', 'coach'), validate({ body: createPlanAssignmentSchema }), createAssignment);

// ==================== /plan-assignments/user/:userId ====================
// GET /plan-assignments/user/:userId - CU.027: Ver asignaciones de usuario - propio o admin/technical_director/coach
// NOTA: Rutas específicas deben ir ANTES de las genéricas /:id
router.get('/user/:userId', requireSelfOrRoles('userId', 'admin', 'technical_director', 'coach'), listAssignmentsForUser);

// ==================== /plan-assignments/training-plan/:trainingPlanId ====================
// GET /plan-assignments/training-plan/:trainingPlanId - CU.027: Ver asignaciones de plan - admin, technical_director, coach
router.get('/training-plan/:trainingPlanId', requireAnyRole('admin', 'technical_director', 'coach'), listAssignmentsForPlan);

// ==================== /plan-assignments/:id ====================
// GET    /plan-assignments/:id - CU.027: Ver asignación
router.get('/:id', validate({ params: idParamSchema }), getAssignment);
// PUT    /plan-assignments/:id - CU.023/024: Editar asignación - admin, technical_director, coach
router.put('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema, body: updatePlanAssignmentSchema }), updateAssignment);
// DELETE /plan-assignments/:id - CU.023/024: Eliminar asignación - admin, technical_director, coach
router.delete('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema }), deleteAssignment);

module.exports = router;
