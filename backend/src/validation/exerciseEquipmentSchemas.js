const Joi = require('joi');

const createExerciseEquipmentSchema = Joi.object({
  equipmentId: Joi.number().integer().positive().required(),
});

module.exports = { createExerciseEquipmentSchema };
