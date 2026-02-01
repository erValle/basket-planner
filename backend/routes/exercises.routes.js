const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { createExerciseSchema, updateExerciseSchema } = require('../src/validation/exerciseSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listExercises, getExercise, createExercise, updateExercise, deleteExercise, getPopularTags } = require('../src/controllers/exerciseController');

router.use(requireAuth);

// ==================== /exercises ====================
// GET  /exercises - CU.016: Catálogo de ejercicios - todos pueden consultar (incluido player)
router.get('/', listExercises);
// POST /exercises - CU.017: Registro de ejercicios - admin, technical_director, coach
router.post('/', requireAnyRole('admin', 'technical_director', 'coach'), validate({ body: createExerciseSchema }), createExercise);

// ==================== /exercises/tags/popular ====================
// GET /exercises/tags/popular - Obtener etiquetas populares (debe ir ANTES de /:id para evitar conflictos)
router.get('/tags/popular', getPopularTags);

// ==================== /exercises/:id ====================
// GET    /exercises/:id - CU.016: Ver ejercicio
router.get('/:id', validate({ params: idParamSchema }), getExercise);
// PUT    /exercises/:id - CU.018: Edición de ejercicios - admin, technical_director, coach
router.put('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema, body: updateExerciseSchema }), updateExercise);
// DELETE /exercises/:id - CU.019: Eliminación de ejercicios - solo admin (control y auditoría)
router.delete('/:id', requireAnyRole('admin'), validate({ params: idParamSchema }), deleteExercise);

module.exports = router;
