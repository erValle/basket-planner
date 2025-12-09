const express = require('express');
const router = express.Router({ mergeParams: true });
const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const { createExerciseEquipmentSchema, updateExerciseEquipmentSchema } = require('../src/validation/exerciseEquipmentSchemas');
const { listForExercise, createForExercise, updateForExercise, deleteForExercise } = require('../src/controllers/exerciseEquipmentController');

router.use(authenticateToken);

router.get('/', listForExercise);
router.post('/', authorizeRoles('admin','technical_director','coach'), validate({ body: createExerciseEquipmentSchema }), createForExercise);
router.put('/:equipmentId', authorizeRoles('admin','technical_director','coach'), validate({ body: updateExerciseEquipmentSchema }), updateForExercise);
router.delete('/:equipmentId', authorizeRoles('admin','technical_director','coach'), deleteForExercise);

module.exports = router;
