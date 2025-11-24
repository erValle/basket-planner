const Joi = require('joi');

const ROLE_VALUES = ['admin', 'coach', 'player'];
const STATUS_VALUES = ['pending', 'active', 'blocked'];

const userQuerySchema = Joi.object({
  email: Joi.string().email().optional(), // partial handled by controller with iLike; still ensure valid email format? allow relaxed
  role: Joi.string().valid(...ROLE_VALUES).optional(),
  status: Joi.string().valid(...STATUS_VALUES).optional()
}).unknown(false);

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid(...ROLE_VALUES).optional(),
  status: Joi.string().valid(...STATUS_VALUES).optional()
});

const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  name: Joi.string().min(2).max(100),
  password: Joi.string().min(6).max(128),
  role: Joi.string().valid(...ROLE_VALUES),
  status: Joi.string().valid(...STATUS_VALUES)
}).min(1);

module.exports = {
  userQuerySchema,
  createUserSchema,
  updateUserSchema,
  ROLE_VALUES,
  STATUS_VALUES
};
