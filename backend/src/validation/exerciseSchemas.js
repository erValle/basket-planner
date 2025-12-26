const Joi = require('joi');

const exerciseTypeValues = ['cardio', 'strength', 'flexibility', 'balance'];

// Stored as JSONB in DB; we accept a flexible object.
// The seeders currently use keys like effortTechnical/effortPhysical/effortMental.
const difficultySchema = Joi.object().unknown(true);

const createExerciseSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  type: Joi.string().valid(...exerciseTypeValues).required(),
  difficulty: difficultySchema.required(),
  duration: Joi.number().integer().min(1).required(),
  description: Joi.string().allow('', null).optional(),
  tags: Joi.array().items(Joi.string().max(40)).optional(),
  active: Joi.boolean().optional()
});

const updateExerciseSchema = Joi.object({
  name: Joi.string().min(2).max(200),
  type: Joi.string().valid(...exerciseTypeValues),
  difficulty: difficultySchema,
  duration: Joi.number().integer().min(1),
  description: Joi.string().allow('', null),
  tags: Joi.array().items(Joi.string().max(40)),
  active: Joi.boolean()
}).min(1);

module.exports = { createExerciseSchema, updateExerciseSchema };
