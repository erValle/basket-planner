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

const createForExercise = async (exerciseId, { equipmentId }) => {
  return ExerciseEquipment.create({ exerciseId, equipmentId });
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
  deleteForExercise,
};
