const Joi = require('joi');

const createPlanAssignmentSchema = Joi.object({
  trainingPlanId: Joi.number().integer().positive().required(),
  userId: Joi.number().integer().positive().required(),
  assignedById: Joi.number().integer().positive().required(),
  assignedAt: Joi.date().optional(),
  status: Joi.string().valid('assigned', 'in_progress', 'completed', 'cancelled').optional(),
});

const updatePlanAssignmentSchema = Joi.object({
  assignedById: Joi.number().integer().positive(),
  assignedAt: Joi.date(),
  status: Joi.string().valid('assigned', 'in_progress', 'completed', 'cancelled'),
}).min(1);

module.exports = { createPlanAssignmentSchema, updatePlanAssignmentSchema };
