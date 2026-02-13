const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { createExerciseSchema, updateExerciseSchema } = require('../src/validation/exerciseSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const {
  listExercises,
  getExercise,
  createExercise,
  updateExercise,
  deleteExercise,
  getPopularTags,
} = require('../src/controllers/exerciseController');

router.use(requireAuth);

// GET  /exercises - Todos autenticados pueden consultar el catálogo de ejercicios
router.get('/', listExercises);
// POST /exercises - Director Técnico y Entrenador pueden registrar ejercicios
router.post(
  '/',
  requireAnyRole('technical_director', 'coach'),
  validate({ body: createExerciseSchema }),
  createExercise
);

// GET /exercises/tags/popular - Obtener etiquetas populares
router.get('/tags/popular', getPopularTags);

// GET    /exercises/:id - Ver ejercicio (todos autenticados)
router.get('/:id', validate({ params: idParamSchema }), getExercise);
// PUT    /exercises/:id - Director Técnico y Entrenador pueden editar ejercicios
router.put(
  '/:id',
  requireAnyRole('technical_director', 'coach'),
  validate({ params: idParamSchema, body: updateExerciseSchema }),
  updateExercise
);
// DELETE /exercises/:id - Director Técnico y Entrenador pueden desactivar ejercicios
router.delete(
  '/:id',
  requireAnyRole('technical_director', 'coach'),
  validate({ params: idParamSchema }),
  deleteExercise
);

module.exports = router;
