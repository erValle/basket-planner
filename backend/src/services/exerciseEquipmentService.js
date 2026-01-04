const { StatusCodes } = require('http-status-codes');

const { ExerciseEquipment, Equipment } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listForExercise = async (exerciseId) => {
  return ExerciseEquipment.findAll({
    where: { exerciseId },
    include: [
      {
        model: Equipment,
        as: 'equipmentItem',
        attributes: ['id', 'name'],
      },
    ],
  });
};

const createForExercise = async (exerciseId, { equipmentId, quantity }) => {
  return ExerciseEquipment.create({ exerciseId, equipmentId, quantity });
};

const updateForExercise = async (exerciseId, equipmentId, { quantity }) => {
  const row = await ExerciseEquipment.findOne({ where: { exerciseId, equipmentId } });
  if (!row) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_EQUIPMENT_NOT_FOUND', 'Relation not found');
  }
  await row.update({ quantity });
  return row;
};

const deleteForExercise = async (exerciseId, equipmentId) => {
  const row = await ExerciseEquipment.findOne({ where: { exerciseId, equipmentId } });
  if (!row) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_EQUIPMENT_NOT_FOUND', 'Relation not found');
  }
  await row.destroy();
};

module.exports = {
  listForExercise,
  createForExercise,
  updateForExercise,
  deleteForExercise,
};
