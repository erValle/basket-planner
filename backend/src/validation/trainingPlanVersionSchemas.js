const Joi = require('joi');

const createTrainingPlanVersionSchema = Joi.object({
  versionNumber: Joi.number().integer().min(1).required(),
  source: Joi.string().max(100).optional(),
  date: Joi.date().required(),
  comments: Joi.string().allow('', null).optional(),
  items: Joi.array().items(Joi.object().unknown(true)).optional()
});

const updateTrainingPlanVersionSchema = Joi.object({
  source: Joi.string().max(100),
  date: Joi.date(),
  comments: Joi.string().allow('', null),
  items: Joi.array().items(Joi.object().unknown(true))
}).min(1);

module.exports = { createTrainingPlanVersionSchema, updateTrainingPlanVersionSchema };
