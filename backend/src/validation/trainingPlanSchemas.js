const Joi = require('joi');

const createTrainingPlanSchema = Joi.object({
  createdById: Joi.number().integer().positive().required(),
  targetType: Joi.string().valid('team', 'user').required(),
  name: Joi.string().min(2).max(200).required(),
  goal: Joi.string().allow('', null).optional(),
  type: Joi.string().max(60).optional(),
  intensity: Joi.string().max(60).optional(),
  duration: Joi.number().integer().min(1).optional(),
  status: Joi.string().valid('draft', 'active', 'archived').optional(),
});

const updateTrainingPlanSchema = Joi.object({
  targetType: Joi.string().valid('team', 'user'),
  name: Joi.string().min(2).max(200),
  goal: Joi.string().allow('', null),
  type: Joi.string().max(60),
  intensity: Joi.string().max(60),
  duration: Joi.number().integer().min(1),
  status: Joi.string().valid('draft', 'active', 'archived'),
}).min(1);

module.exports = { createTrainingPlanSchema, updateTrainingPlanSchema };
