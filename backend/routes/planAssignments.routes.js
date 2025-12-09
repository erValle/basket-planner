const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles, authorizeSelfOrRoles } = require('../src/middlewares/auth');
const { createPlanAssignmentSchema, updatePlanAssignmentSchema } = require('../src/validation/planAssignmentSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listAssignments, getAssignment, createAssignment, updateAssignment, deleteAssignment, listAssignmentsForUser, listAssignmentsForPlan } = require('../src/controllers/planAssignmentController');

router.use(authenticateToken);

router.get('/', listAssignments);
router.get('/:id', validate({ params: idParamSchema }), getAssignment);
router.post('/', authorizeRoles('admin','technical_director','coach'), validate({ body: createPlanAssignmentSchema }), createAssignment);
router.put('/:id', authorizeRoles('admin','technical_director','coach'), validate({ params: idParamSchema, body: updatePlanAssignmentSchema }), updateAssignment);
router.delete('/:id', authorizeRoles('admin','technical_director','coach'), validate({ params: idParamSchema }), deleteAssignment);
router.get('/user/:userId', authorizeSelfOrRoles('userId','admin','technical_director','coach'), listAssignmentsForUser);
router.get('/training-plan/:trainingPlanId', authorizeRoles('admin','technical_director','coach'), listAssignmentsForPlan);

module.exports = router;
