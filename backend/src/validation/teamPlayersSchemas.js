const Joi = require('joi');

// Reuse patterns from other schemas: ids are positive integers.
const teamIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const addTeamPlayerSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
});

const addTeamPlayersBulkSchema = Joi.object({
  userIds: Joi.array().items(Joi.number().integer().positive()).min(1).max(200).required(),
});

const removeTeamPlayerSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
});

// Optional filtering for list (MVP): limit + search by name/email.
const listTeamPlayersQuerySchema = Joi.object({
  search: Joi.string().allow('', null).optional(),
  limit: Joi.number().integer().min(1).max(500).optional(),
});

module.exports = {
  teamIdParamSchema,
  addTeamPlayerSchema,
  addTeamPlayersBulkSchema,
  removeTeamPlayerSchema,
  listTeamPlayersQuerySchema,
};
