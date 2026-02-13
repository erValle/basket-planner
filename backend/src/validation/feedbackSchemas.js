const Joi = require('joi');

const ratingSchema = Joi.object({
  // Version-level ratings
  physicalEffort: Joi.number().integer().min(1).max(10),
  technicalEffort: Joi.number().integer().min(1).max(10),
  mentalEffort: Joi.number().integer().min(1).max(10),
  overall: Joi.number().integer().min(1).max(10),

  // Session-level ratings (RPE, fatigue, etc.)
  rpe: Joi.number().integer().min(1).max(10),
  fatigue: Joi.number().integer().min(1).max(10),
  pain: Joi.number().integer().min(0).max(10),
  sleep: Joi.number().integer().min(1).max(5),
  stress: Joi.number().integer().min(1).max(5),
  mood: Joi.number().integer().min(1).max(5),
})
  .min(1)
  .unknown(true);

const createFeedbackSchema = Joi.object({
  trainingPlanVersionId: Joi.number().integer().positive().required(),
  targetType: Joi.string().valid('version', 'session').default('version'),
  sessionId: Joi.alternatives().conditional('targetType', {
    is: 'session',
    then: Joi.string().required(),
    otherwise: Joi.string().allow(null).optional(),
  }),
  rating: ratingSchema.required(),
  comments: Joi.string().allow('', null).optional(),
});

const updateFeedbackSchema = Joi.object({
  rating: ratingSchema,
  comments: Joi.string().allow('', null),
}).min(1);

module.exports = { createFeedbackSchema, updateFeedbackSchema };
