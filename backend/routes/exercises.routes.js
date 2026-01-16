const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { createExerciseSchema, updateExerciseSchema } = require('../src/validation/exerciseSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listExercises, getExercise, createExercise, updateExercise, deleteExercise, getPopularTags } = require('../src/controllers/exerciseController');

router.use(requireAuth);

// Obtener etiquetas populares (debe ir ANTES de /:id para evitar conflictos)
router.get('/tags/popular', getPopularTags);

// CU.016: Catálogo de ejercicios - todos pueden consultar (incluido player)
router.get('/', listExercises);
router.get('/:id', validate({ params: idParamSchema }), getExercise);

// CU.017: Registro de ejercicios - admin, technical_director, coach
router.post('/', requireAnyRole('admin', 'technical_director', 'coach'), validate({ body: createExerciseSchema }), createExercise);

// CU.018: Edición de ejercicios - admin, technical_director, coach
router.put('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema, body: updateExerciseSchema }), updateExercise);

// CU.019: Eliminación de ejercicios - solo admin (control y auditoría)
router.delete('/:id', requireAnyRole('admin'), validate({ params: idParamSchema }), deleteExercise);

module.exports = router;
