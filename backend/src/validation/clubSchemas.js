const Joi = require('joi');

const createClubSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  description: Joi.string().max(500).allow('', null),
  city: Joi.string().max(120).allow('', null),
  country: Joi.string().max(120).allow('', null),
  status: Joi.string().valid('active', 'inactive').optional(),
});

const updateClubSchema = Joi.object({
  name: Joi.string().min(2).max(120),
  description: Joi.string().max(500).allow('', null),
  city: Joi.string().max(120).allow('', null),
  country: Joi.string().max(120).allow('', null),
  status: Joi.string().valid('active', 'inactive'),
}).min(1);

module.exports = { createClubSchema, updateClubSchema };
