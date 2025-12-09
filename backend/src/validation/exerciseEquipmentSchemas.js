const Joi = require('joi');

const createExerciseEquipmentSchema = Joi.object({
  equipmentId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).required()
});

const updateExerciseEquipmentSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required()
});

module.exports = { createExerciseEquipmentSchema, updateExerciseEquipmentSchema };
