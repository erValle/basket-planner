const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole, requireSelfOrRoles } = require('../src/middlewares/rbac');
const { createPlanAssignmentSchema, updatePlanAssignmentSchema } = require('../src/validation/planAssignmentSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listAssignments, getAssignment, createAssignment, updateAssignment, deleteAssignment, listAssignmentsForUser, listAssignmentsForPlan } = require('../src/controllers/planAssignmentController');

router.use(requireAuth);

// CU.027: Ver asignaciones de usuario - propio o roles admin/technical_director/coach
// IMPORTANTE: Estas rutas específicas deben ir ANTES de las genéricas /:id
router.get('/user/:userId', requireSelfOrRoles('userId', 'admin', 'technical_director', 'coach'), listAssignmentsForUser);
router.get('/training-plan/:trainingPlanId', requireAnyRole('admin', 'technical_director', 'coach'), listAssignmentsForPlan);

// CU.027: Visualización de asignaciones
router.get('/', listAssignments);
router.get('/:id', validate({ params: idParamSchema }), getAssignment);

// CU.023/024: Crear asignaciones - admin, technical_director, coach
router.post('/', requireAnyRole('admin', 'technical_director', 'coach'), validate({ body: createPlanAssignmentSchema }), createAssignment);
router.put('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema, body: updatePlanAssignmentSchema }), updateAssignment);
router.delete('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema }), deleteAssignment);

module.exports = router;
