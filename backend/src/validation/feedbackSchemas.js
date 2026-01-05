const Joi = require('joi');

const ratingSchema = Joi.object({
  physicalEffort: Joi.number().integer().min(1).max(10),
  technicalEffort: Joi.number().integer().min(1).max(10),
  mentalEffort: Joi.number().integer().min(1).max(10),
  overall: Joi.number().integer().min(1).max(10),
}).min(1).unknown(true);

const createFeedbackSchema = Joi.object({
  trainingPlanVersionId: Joi.number().integer().positive().required(),
  rating: ratingSchema.required(),
  comments: Joi.string().allow('', null).optional()
});

const updateFeedbackSchema = Joi.object({
  rating: ratingSchema,
  comments: Joi.string().allow('', null)
}).min(1);

module.exports = { createFeedbackSchema, updateFeedbackSchema };
