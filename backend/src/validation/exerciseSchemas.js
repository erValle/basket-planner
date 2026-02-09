const Joi = require('joi');

// Tipos de ejercicios específicos para baloncesto
const exerciseTypeValues = ['tecnico', 'tactico', 'fisico', 'tiro', 'defensa', 'ataque'];

/**
 * Schema de validación para difficulty en formato JSONB
 * Estructura estricta: { tactica: 1-5, tecnica: 1-5, fisica: 1-5, mental: 1-5 }
 */
const difficultySchema = Joi.object({
  tactica: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'dificultadTactica debe ser un número',
    'number.min': 'dificultadTactica debe ser al menos 1',
    'number.max': 'dificultadTactica no puede ser mayor que 5',
    'any.required': 'dificultadTactica es requerida',
  }),
  tecnica: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'dificultadTecnica debe ser un número',
    'number.min': 'dificultadTecnica debe ser al menos 1',
    'number.max': 'dificultadTecnica no puede ser mayor que 5',
    'any.required': 'dificultadTecnica es requerida',
  }),
  fisica: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'dificultadFisica debe ser un número',
    'number.min': 'dificultadFisica debe ser al menos 1',
    'number.max': 'dificultadFisica no puede ser mayor que 5',
    'any.required': 'dificultadFisica es requerida',
  }),
  mental: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'dificultadMental debe ser un número',
    'number.min': 'dificultadMental debe ser al menos 1',
    'number.max': 'dificultadMental no puede ser mayor que 5',
    'any.required': 'dificultadMental es requerida',
  }),
})
  .required()
  .messages({
    'any.required': 'El campo difficulty es requerido',
    'object.base': 'El campo difficulty debe ser un objeto con las 4 dimensiones',
  });

/**
 * Schema de validación para tags en formato JSONB
 * Puede ser un array de strings (compatibilidad) o un objeto con tipo_original
 */
const tagsSchema = Joi.alternatives().try(
  Joi.array().items(Joi.string().max(40)),
  Joi.object({
    tipo_original: Joi.string().max(50).optional(),
    tags: Joi.array().items(Joi.string().max(40)).optional(),
    materiales: Joi.array().items(Joi.string().max(50)).optional(),
  })
);

const createExerciseSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  type: Joi.string()
    .valid(...exerciseTypeValues)
    .required(),
  difficulty: difficultySchema.required(),
  duration: Joi.number().integer().min(1).required(),
  description: Joi.string().allow('', null).optional(),
  tags: tagsSchema.optional(),
  active: Joi.boolean().optional(),
});

const updateExerciseSchema = Joi.object({
  name: Joi.string().min(2).max(200),
  type: Joi.string().valid(...exerciseTypeValues),
  difficulty: difficultySchema,
  duration: Joi.number().integer().min(1),
  description: Joi.string().allow('', null),
  tags: tagsSchema,
  active: Joi.boolean(),
}).min(1);

module.exports = { createExerciseSchema, updateExerciseSchema };
