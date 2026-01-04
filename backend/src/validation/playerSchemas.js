const Joi = require('joi');

// Query params for listing players (users with role=player)
const playerQuerySchema = Joi.object({
  search: Joi.string().allow('', null).optional(),
  clubId: Joi.number().integer().positive().optional(),
  teamId: Joi.number().integer().positive().optional(),
  limit: Joi.number().integer().min(1).max(200).optional(),
}).unknown(true);

module.exports = { playerQuerySchema };
