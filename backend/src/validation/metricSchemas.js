const Joi = require('joi');

const createMetricSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  value: Joi.number().required(),
  metadata: Joi.object().unknown(true).optional(),
  recordedAt: Joi.date().optional()
});

const updateMetricSchema = Joi.object({
  name: Joi.string().min(2).max(120),
  value: Joi.number(),
  metadata: Joi.object().unknown(true),
  recordedAt: Joi.date()
}).min(1);

module.exports = { createMetricSchema, updateMetricSchema };
