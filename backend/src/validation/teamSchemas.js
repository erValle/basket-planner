const Joi = require('joi');

const createTeamSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  category: Joi.string().max(60).allow(null).optional(),
  clubId: Joi.number().integer().positive().required(),
  coachId: Joi.number().integer().positive().allow(null).optional(),
  active: Joi.boolean().optional(),
});

const updateTeamSchema = Joi.object({
  name: Joi.string().min(2).max(120),
  category: Joi.string().max(60),
  clubId: Joi.number().integer().positive(),
  coachId: Joi.number().integer().positive().allow(null),
  active: Joi.boolean(),
}).min(1);

const listTeamsQuerySchema = Joi.object({
  clubId: Joi.string().optional(),
  category: Joi.string().max(60).optional(),
});

module.exports = { createTeamSchema, updateTeamSchema, listTeamsQuerySchema };
