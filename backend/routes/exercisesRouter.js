const express = require('express');
const router = express.Router();

const {
  getAllExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
} = require('../src/controllers/exerciseController');
const validate = require('../src/middlewares/validate');
const { exerciseQuerySchema, createExerciseSchema, updateExerciseSchema } = require('../src/validation/exerciseSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');

router.get('/', validate({ query: exerciseQuerySchema }), getAllExercises);
router.get('/:id', validate({ params: idParamSchema }), getExerciseById);
router.post('/', validate({ body: createExerciseSchema }), createExercise);
router.put('/:id', validate({ params: idParamSchema, body: updateExerciseSchema }), updateExercise);
router.delete('/:id', validate({ params: idParamSchema }), deleteExercise);

module.exports = router;