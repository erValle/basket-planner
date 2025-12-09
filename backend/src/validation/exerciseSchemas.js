const Joi = require('joi');

const createExerciseSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  type: Joi.string().max(60).optional(),
  difficulty: Joi.string().valid('easy','medium','hard').optional(),
  description: Joi.string().allow('', null).optional(),
  tags: Joi.array().items(Joi.string().max(40)).optional(),
  active: Joi.boolean().optional()
});

const updateExerciseSchema = Joi.object({
  name: Joi.string().min(2).max(200),
  type: Joi.string().max(60),
  difficulty: Joi.string().valid('easy','medium','hard'),
  description: Joi.string().allow('', null),
  tags: Joi.array().items(Joi.string().max(40)),
  active: Joi.boolean()
}).min(1);

module.exports = { createExerciseSchema, updateExerciseSchema };
