const Joi = require('joi');

const ROLE_VALUES = ['admin', 'technical_director', 'coach', 'player', 'user'];
const STATUS_VALUES = ['active', 'inactive'];

const userQuerySchema = Joi.object({
  email: Joi.string().optional(), // Allow partial search, no strict email validation (legacy support)
  search: Joi.string().optional(), // Generic search in email, firstName, lastName
  role: Joi.string().valid(...ROLE_VALUES).optional(),
  status: Joi.string().valid(...STATUS_VALUES).optional()
}).unknown(false);

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid(...ROLE_VALUES).default('user').optional(),
  status: Joi.string().valid(...STATUS_VALUES).optional()
});

const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  name: Joi.string().min(2).max(100),
  password: Joi.string().min(6).max(128),
  role: Joi.string().valid(...ROLE_VALUES),
  status: Joi.string().valid(...STATUS_VALUES)
}).min(1);

const assignUsersToClubSchema = Joi.object({
  userIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  clubId: Joi.number().integer().positive().required()
});

module.exports = {
  userQuerySchema,
  createUserSchema,
  updateUserSchema,
  assignUsersToClubSchema,
  ROLE_VALUES,
  STATUS_VALUES
};
