const Joi = require('joi');

const createUserClubSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  clubId: Joi.number().integer().positive().required(),
  isPrimary: Joi.boolean().default(false),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});

const updateUserClubSchema = Joi.object({
  isPrimary: Joi.boolean(),
  startDate: Joi.date(),
  endDate: Joi.date()
}).min(1);

module.exports = { createUserClubSchema, updateUserClubSchema };
