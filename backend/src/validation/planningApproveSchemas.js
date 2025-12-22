const Joi = require('joi');

const exerciseSchema = Joi.object({
  id: Joi.string().max(64).required(),
  name: Joi.string().min(1).max(200).required(),
  type: Joi.string().min(1).max(60).required(),
  durationMinutes: Joi.number().integer().min(1).max(600).required(),
  intensity: Joi.string().valid('low', 'medium', 'high').required(),
  estimatedLoad: Joi.number().integer().min(0).required()
}).unknown(true);

const sessionSchema = Joi.object({
  sessionId: Joi.string().max(64).required(),
  day: Joi.string().valid('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun').required(),
  focusTags: Joi.array().items(Joi.string().min(1).max(64)).default([]),
  exercises: Joi.array().items(exerciseSchema).min(1).required(),
  metrics: Joi.object({
    durationMinutes: Joi.number().integer().min(1).required(),
    estimatedLoad: Joi.number().integer().min(0).required()
  }).required()
}).unknown(true);

const approveGeneratedPlanSchema = Joi.object({
  proposal: Joi.object({
    kind: Joi.string().valid('individual', 'group').required(),
    generatedAt: Joi.date().required(),
    inputSummary: Joi.object().required(),
    sessions: Joi.array().items(sessionSchema).min(1).required(),
    metrics: Joi.object({
      durationTotalMinutes: Joi.number().integer().min(1).required(),
      estimatedLoadTotal: Joi.number().integer().min(0).required(),
      sessionsCount: Joi.number().integer().min(1).required()
    }).required()
  }).required(),

  plan: Joi.object({
    targetType: Joi.string().valid('user', 'team', 'individual', 'group').default('user'),
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().allow('', null).optional(),
    goal: Joi.string().allow('', null).optional(),
    type: Joi.string().allow('', null).optional(),
    intensity: Joi.string().allow('', null).optional(),
    duration: Joi.number().integer().min(1).optional(),
    status: Joi.string().valid('draft', 'active', 'archived').default('draft')
  }).required()
});

module.exports = {
  approveGeneratedPlanSchema
};
