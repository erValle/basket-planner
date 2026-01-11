const Joi = require('joi');

const auditLogListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(200).default(20),
  // Alias for pageSize used by frontend
  limit: Joi.number().integer().min(1).max(200).optional(),

  action: Joi.string().trim().allow('').optional(),
  entity: Joi.string().trim().allow('').optional(),
  entityId: Joi.string().trim().allow('').optional(),
  userId: Joi.alternatives()
    .try(
      Joi.number().integer().positive(),
      Joi.string().valid('').optional()
    )
    .optional(),
  requestId: Joi.string().trim().allow('').optional(),

  // ISO strings; allow empty string or valid ISO date
  from: Joi.alternatives()
    .try(
      Joi.date().iso(),
      Joi.string().valid('').optional()
    )
    .optional(),
  to: Joi.alternatives()
    .try(
      Joi.date().iso(),
      Joi.string().valid('').optional()
    )
    .optional(),
});

module.exports = {
  auditLogListQuerySchema,
};
