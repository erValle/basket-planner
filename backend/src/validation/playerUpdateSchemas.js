const Joi = require('joi');

// Restricted update for a player's sports profile.
// Intentionally excludes personal fields like email/firstName/lastName/password.
const updatePlayerProfileSchema = Joi.object({
  status: Joi.string().valid('pending', 'active', 'blocked').optional(),
  position: Joi.string().allow('', null).max(50).optional(),
  category: Joi.string().allow('', null).max(50).optional(),
  maxCategory: Joi.string().allow('', null).max(50).optional(),
  height: Joi.number().min(0).max(300).allow(null).optional(),
  dateOfBirth: Joi.date().iso().allow(null).optional(),
}).min(1).unknown(false);

module.exports = { updatePlayerProfileSchema };
