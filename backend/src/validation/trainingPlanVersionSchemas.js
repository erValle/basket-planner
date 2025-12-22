const Joi = require('joi');

const createTrainingPlanVersionSchema = Joi.object({
  versionNumber: Joi.number().integer().min(1).required(),
  source: Joi.string().max(100).optional(),
  date: Joi.date().required(),
  comments: Joi.string().allow('', null).optional(),
  items: Joi.object().unknown(true).optional()
});

const updateTrainingPlanVersionSchema = Joi.object({
  source: Joi.string().max(100),
  date: Joi.date(),
  comments: Joi.string().allow('', null),
  items: Joi.object().unknown(true)
}).min(1);

const restoreTrainingPlanVersionSchema = Joi.object({
  comments: Joi.string().allow('', null).optional(),
  date: Joi.date().optional(),
  source: Joi.string().valid('manual', 'automatic').default('manual'),
});

module.exports = { createTrainingPlanVersionSchema, updateTrainingPlanVersionSchema, restoreTrainingPlanVersionSchema };
