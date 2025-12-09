const Joi = require('joi');

const createFeedbackSchema = Joi.object({
  trainingPlanVersionId: Joi.number().integer().positive().required(),
  userId: Joi.number().integer().positive().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().allow('', null).optional()
});

const updateFeedbackSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5),
  comment: Joi.string().allow('', null)
}).min(1);

module.exports = { createFeedbackSchema, updateFeedbackSchema };
