const express = require('express');
const router = express.Router({ mergeParams: true });
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { createExerciseEquipmentSchema } = require('../src/validation/exerciseEquipmentSchemas');
const { listForExercise, createForExercise, deleteForExercise } = require('../src/controllers/exerciseEquipmentController');

router.use(requireAuth);

router.get('/', listForExercise);
router.post('/', requireAnyRole('admin', 'technical_director', 'coach'), validate({ body: createExerciseEquipmentSchema }), createForExercise);
router.delete('/:equipmentId', requireAnyRole('admin', 'technical_director', 'coach'), deleteForExercise);

module.exports = router;
