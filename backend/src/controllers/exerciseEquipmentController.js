const { StatusCodes } = require('http-status-codes');
const { ExerciseEquipment } = require('../../models');
const logger = require('../middlewares/logger');
const errorUtils = require('../libs/errorHelper');

const listForExercise = async (req, res, next) => {
  try {
    const rows = await ExerciseEquipment.findAll({ where: { exerciseId: req.params.exerciseId } });
    res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error('Error fetching exercise equipment:', error);
    return next(error);
  }
};

const createForExercise = async (req, res, next) => {
  try {
    const created = await ExerciseEquipment.create({ exerciseId: req.params.exerciseId, ...req.body });
    res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error linking equipment to exercise:', error);
    return next(error);
  }
};

const updateForExercise = async (req, res, next) => {
  try {
    const row = await ExerciseEquipment.findOne({ where: { exerciseId: req.params.exerciseId, equipmentId: req.params.equipmentId } });
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_EQUIPMENT_NOT_FOUND', 'Relation not found'));
    await row.update({ quantity: req.body.quantity });
    res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error updating relation:', error);
    return next(error);
  }
};

const deleteForExercise = async (req, res, next) => {
  try {
    const row = await ExerciseEquipment.findOne({ where: { exerciseId: req.params.exerciseId, equipmentId: req.params.equipmentId } });
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_EQUIPMENT_NOT_FOUND', 'Relation not found'));
    await row.destroy();
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting relation:', error);
    return next(error);
  }
};

module.exports = { listForExercise, createForExercise, updateForExercise, deleteForExercise };
