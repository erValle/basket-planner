const Joi = require('joi');

const intensityValues = ['low', 'medium', 'high'];
const MAX_SESSIONS = 7;
const DEFAULT_SESSIONS = 3;
const MAX_GOALS = 20;

const individualGenerateSchema = Joi.object({
  profile: Joi.object({
    playerId: Joi.number().integer().positive().required(),
    position: Joi.string().valid('base', 'escolta', 'alero', 'ala-pivot', 'pivot').optional(),
    numberOfSessions: Joi.number().integer().min(1).max(MAX_SESSIONS).default(DEFAULT_SESSIONS),
    sessionDurationMinutes: Joi.number().integer().min(15).max(240).default(75),
    intensity: Joi.string().valid(...intensityValues).default('medium'),
    // DEPRECATED: Use numberOfSessions instead
    maxSessionsPerWeek: Joi.number().integer().min(1).max(MAX_SESSIONS).optional(),
    // DEPRECATED: duration is now per session, not total
    maxDurationMinutes: Joi.number().integer().min(30).max(480).optional()
  }).required(),
  goals: Joi.array().items(Joi.string().min(2).max(64)).min(0).max(MAX_GOALS).default([]),
  constraints: Joi.object({
    equipment: Joi.array().items(Joi.string().min(2).max(64)).min(0).max(20).default([])
  }).default({})
});

const groupGenerateSchema = Joi.object({
  group: Joi.object({
    groupId: Joi.number().integer().positive().optional(),
    name: Joi.string().min(2).max(64).optional(),
    numberOfSessions: Joi.number().integer().min(1).max(MAX_SESSIONS).default(DEFAULT_SESSIONS),
    sessionDurationMinutes: Joi.number().integer().min(15).max(240).default(90),
    intensity: Joi.string().valid(...intensityValues).default('medium'),
    // DEPRECATED: Use numberOfSessions instead
    maxSessionsPerWeek: Joi.number().integer().min(1).max(MAX_SESSIONS).optional(),
    // DEPRECATED: duration is now per session, not total
    maxDurationMinutes: Joi.number().integer().min(30).max(480).optional()
  }).required(),
  profiles: Joi.array()
    .items(
      Joi.object({
        playerId: Joi.number().integer().positive().required(),
        position: Joi.string().valid('base', 'escolta', 'alero', 'ala-pivot', 'pivot').optional()
      })
    )
    .min(2)
    .max(30)
    .required(),
  goals: Joi.array().items(Joi.string().min(2).max(64)).min(0).max(MAX_GOALS).default([]),
  constraints: Joi.object({
    equipment: Joi.array().items(Joi.string().min(2).max(64)).min(0).max(20).default([])
  }).default({})
});

module.exports = {
  individualGenerateSchema,
  groupGenerateSchema
};
