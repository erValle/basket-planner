const Joi = require('joi');

const createUserClubSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  clubId: Joi.number().integer().positive().required(),
  isPrimary: Joi.boolean().default(false),
  startDate: Joi.date().required(),
  endDate: Joi.date().optional().allow(null),
});

const updateUserClubSchema = Joi.object({
  isPrimary: Joi.boolean(),
  startDate: Joi.date(),
  endDate: Joi.date(),
}).min(1);

module.exports = { createUserClubSchema, updateUserClubSchema };
