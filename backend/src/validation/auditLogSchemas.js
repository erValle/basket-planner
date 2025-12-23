const Joi = require('joi');

const auditLogListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),

  action: Joi.string().trim().min(1).optional(),
  entity: Joi.string().trim().min(1).optional(),
  entityId: Joi.string().trim().min(1).optional(),
  userId: Joi.number().integer().positive().optional(),
  requestId: Joi.string().trim().min(1).optional(),

  // ISO strings; optional
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
});

module.exports = {
  auditLogListQuerySchema,
};
