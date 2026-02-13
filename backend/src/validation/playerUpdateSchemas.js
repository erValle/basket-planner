const Joi = require('joi');

// Update for a player's profile including personal and sports fields.
const updatePlayerProfileSchema = Joi.object({
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
  position: Joi.string().allow('', null).max(50).optional(),
  category: Joi.string().allow('', null).max(50).optional(),
  maxCategory: Joi.string().allow('', null).max(50).optional(),
  height: Joi.number().min(0).max(300).allow(null).optional(),
  dateOfBirth: Joi.date().iso().allow(null).optional(),
})
  .min(1)
  .unknown(false);

module.exports = { updatePlayerProfileSchema };
