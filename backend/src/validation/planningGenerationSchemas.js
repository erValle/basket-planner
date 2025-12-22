const Joi = require('joi');

const intensityValues = ['low', 'medium', 'high'];

const individualGenerateSchema = Joi.object({
  profile: Joi.object({
    athleteId: Joi.number().integer().positive().required(),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced').default('intermediate'),
    position: Joi.string().valid('guard', 'forward', 'center').optional(),
    maxSessionsPerWeek: Joi.number().integer().min(1).max(14).default(4),
    sessionDurationMinutes: Joi.number().integer().min(15).max(240).default(75),
    intensity: Joi.string().valid(...intensityValues).default('medium')
  }).required(),
  goals: Joi.array().items(Joi.string().min(2).max(64)).min(0).max(10).default([]),
  constraints: Joi.object({
    days: Joi.array()
      .items(Joi.string().valid('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'))
      .min(1)
      .max(7)
      .default(['mon', 'wed', 'fri']),
    equipment: Joi.array().items(Joi.string().min(2).max(64)).min(0).max(20).default([]),
    injuries: Joi.array().items(Joi.string().min(2).max(128)).min(0).max(20).default([])
  }).default({})
});

const groupGenerateSchema = Joi.object({
  group: Joi.object({
    groupId: Joi.number().integer().positive().optional(),
    name: Joi.string().min(2).max(64).optional(),
    maxSessionsPerWeek: Joi.number().integer().min(1).max(14).default(4),
    sessionDurationMinutes: Joi.number().integer().min(15).max(240).default(90),
    intensity: Joi.string().valid(...intensityValues).default('medium')
  }).required(),
  profiles: Joi.array()
    .items(
      Joi.object({
        athleteId: Joi.number().integer().positive().required(),
        level: Joi.string().valid('beginner', 'intermediate', 'advanced').default('intermediate'),
        position: Joi.string().valid('guard', 'forward', 'center').optional()
      })
    )
    .min(2)
    .max(30)
    .required(),
  goals: Joi.array().items(Joi.string().min(2).max(64)).min(0).max(10).default([]),
  constraints: Joi.object({
    days: Joi.array()
      .items(Joi.string().valid('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'))
      .min(1)
      .max(7)
      .default(['mon', 'wed', 'fri']),
    equipment: Joi.array().items(Joi.string().min(2).max(64)).min(0).max(20).default([])
  }).default({})
});

module.exports = {
  individualGenerateSchema,
  groupGenerateSchema
};
