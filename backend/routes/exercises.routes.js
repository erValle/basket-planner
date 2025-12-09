const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const { createExerciseSchema, updateExerciseSchema } = require('../src/validation/exerciseSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listExercises, getExercise, createExercise, updateExercise, deleteExercise } = require('../src/controllers/exerciseController');

router.use(authenticateToken);

router.get('/', listExercises);
router.get('/:id', validate({ params: idParamSchema }), getExercise);
router.post('/', authorizeRoles('admin','technical_director','coach'), validate({ body: createExerciseSchema }), createExercise);
router.put('/:id', authorizeRoles('admin','technical_director','coach'), validate({ params: idParamSchema, body: updateExerciseSchema }), updateExercise);
router.delete('/:id', authorizeRoles('admin','technical_director','coach'), validate({ params: idParamSchema }), deleteExercise);

module.exports = router;
