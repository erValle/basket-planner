const Joi = require('joi');

const ROLE_VALUES = ['admin', 'technical_director', 'coach', 'staff', 'player'];
const STATUS_VALUES = ['pending', 'active', 'blocked'];

const userQuerySchema = Joi.object({
  email: Joi.string().email().optional(), // partial handled by controller with iLike; still ensure valid email format? allow relaxed
  // role can be one of known roles, or 'none' to list users without role
  role: Joi.string().valid(...ROLE_VALUES, 'none').optional(),
  status: Joi.string().valid(...STATUS_VALUES).optional()
}).unknown(false);

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  // Backward-compat: older clients send `name`, newer model uses `firstName`/`lastName`.
  // Accept either form.
  name: Joi.string().min(2).max(100),
  firstName: Joi.string().min(1).max(100),
  lastName: Joi.string().min(1).max(100),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid(...ROLE_VALUES).allow(null).optional(),
  status: Joi.string().valid(...STATUS_VALUES).optional()
})
  .or('name', 'firstName')
  .and('firstName', 'lastName');

const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  name: Joi.string().min(2).max(100),
  firstName: Joi.string().min(1).max(100),
  lastName: Joi.string().min(1).max(100),
  password: Joi.string().min(6).max(128),
  role: Joi.string().valid(...ROLE_VALUES).allow(null),
  status: Joi.string().valid(...STATUS_VALUES)
})
  .min(1)
  .and('firstName', 'lastName');

module.exports = {
  userQuerySchema,
  createUserSchema,
  updateUserSchema,
  ROLE_VALUES,
  STATUS_VALUES
};
