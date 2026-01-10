const Joi = require('joi');

const createEquipmentSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  clubId: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('available', 'unavailable', 'maintenance').optional(),
  characteristics: Joi.object().unknown(true).optional()
});

const updateEquipmentSchema = Joi.object({
  name: Joi.string().min(2).max(120),
  clubId: Joi.number().integer().positive(),
  status: Joi.string().valid('available', 'unavailable', 'maintenance'),
  characteristics: Joi.object().unknown(true)
}).min(1);

module.exports = { createEquipmentSchema, updateEquipmentSchema };
