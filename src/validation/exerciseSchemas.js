const Joi = require('joi');

const CATEGORY_VALUES = ['shooting', 'dribbling', 'passing', 'defense', 'strength', 'agility', 'tactics', 'endurance'];
const DIFFICULTY_VALUES = ['easy', 'medium', 'hard'];

const exerciseQuerySchema = Joi.object({
  name: Joi.string().min(1).optional(),
  category: Joi.string().valid(...CATEGORY_VALUES).optional(),
  difficulty: Joi.string().valid(...DIFFICULTY_VALUES).optional(),
  isActive: Joi.boolean().truthy('true').falsy('false').optional()
}).unknown(false);

const createExerciseSchema = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  description: Joi.string().min(5).required(),
  category: Joi.string().valid(...CATEGORY_VALUES).required(),
  difficulty: Joi.string().valid(...DIFFICULTY_VALUES).required(),
  duration: Joi.number().integer().positive().max(86400).optional(),
  isActive: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().min(1)).optional(),
  mediaUrl: Joi.string().uri().optional(),
  weights: Joi.object().pattern(/.*/, Joi.number()).optional()
});

const updateExerciseSchema = Joi.object({
  name: Joi.string().min(2).max(150),
  description: Joi.string().min(5),
  category: Joi.string().valid(...CATEGORY_VALUES),
  difficulty: Joi.string().valid(...DIFFICULTY_VALUES),
  duration: Joi.number().integer().positive().max(86400),
  isActive: Joi.boolean(),
  tags: Joi.array().items(Joi.string().min(1)),
  mediaUrl: Joi.string().uri(),
  weights: Joi.object().pattern(/.*/, Joi.number())
}).min(1);

module.exports = {
  exerciseQuerySchema,
  createExerciseSchema,
  updateExerciseSchema,
  CATEGORY_VALUES,
  DIFFICULTY_VALUES
};
