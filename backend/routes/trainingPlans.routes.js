const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const { createTrainingPlanSchema, updateTrainingPlanSchema } = require('../src/validation/trainingPlanSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listTrainingPlans, getTrainingPlan, createTrainingPlan, updateTrainingPlan, deleteTrainingPlan } = require('../src/controllers/trainingPlanController');

router.use(authenticateToken);

router.get('/', listTrainingPlans);
router.get('/:id', validate({ params: idParamSchema }), getTrainingPlan);
router.post('/', authorizeRoles('admin','technical_director','coach'), validate({ body: createTrainingPlanSchema }), createTrainingPlan);
router.put('/:id', authorizeRoles('admin','technical_director','coach'), validate({ params: idParamSchema, body: updateTrainingPlanSchema }), updateTrainingPlan);
router.delete('/:id', authorizeRoles('admin','technical_director','coach'), validate({ params: idParamSchema }), deleteTrainingPlan);

module.exports = router;
