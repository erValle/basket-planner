const Joi = require('joi');

// CU014 - Transfer player between clubs.
// Player can belong to multiple clubs, but should always have a single *active* primary membership.
// This endpoint closes the previous primary membership (if any) and creates a new one.
const transferPlayerSchema = Joi.object({
  clubId: Joi.number().integer().positive().required(),
  // Date at which new membership starts. Defaults to "today" in service.
  startDate: Joi.date().optional(),
  // Date used to close previous membership. Defaults to startDate (or today if startDate is missing).
  closePreviousAt: Joi.date().optional(),
  // New membership will be primary by default.
  makePrimary: Joi.boolean().default(true),
}).unknown(false);

module.exports = {
  transferPlayerSchema,
};
