const Joi = require('joi');

// Enroll an existing user (role is null) as a player.
// - If clubId is omitted: for coach, it will default to coach's primary club.
// - If clubId is provided: allowed for admin/technical_director.
const enrollPlayerSchema = Joi.object({
	userId: Joi.number().integer().positive().required(),
	clubId: Joi.number().integer().positive().optional(),
	startDate: Joi.date().iso().optional(),
}).unknown(false);

module.exports = { enrollPlayerSchema };

