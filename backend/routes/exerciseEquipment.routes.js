const express = require('express');
const router = express.Router({ mergeParams: true });
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { createExerciseEquipmentSchema } = require('../src/validation/exerciseEquipmentSchemas');
const {
  listForExercise,
  createForExercise,
  deleteForExercise,
} = require('../src/controllers/exerciseEquipmentController');

router.use(requireAuth);

// ==================== /exercises/:exerciseId/equipment ====================
// GET  /exercises/:exerciseId/equipment - Listar equipamiento de ejercicio - todos autenticados
router.get('/', listForExercise);
// POST /exercises/:exerciseId/equipment - Asociar equipamiento - admin, technical_director, coach
router.post(
  '/',
  requireAnyRole('admin', 'technical_director', 'coach'),
  validate({ body: createExerciseEquipmentSchema }),
  createForExercise
);

// ==================== /exercises/:exerciseId/equipment/:equipmentId ====================
// DELETE /exercises/:exerciseId/equipment/:equipmentId - Eliminar asociación - admin, technical_director, coach
router.delete(
  '/:equipmentId',
  requireAnyRole('admin', 'technical_director', 'coach'),
  deleteForExercise
);

module.exports = router;
