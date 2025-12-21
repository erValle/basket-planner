const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const exerciseEquipmentService = require('../services/exerciseEquipmentService');

const listForExercise = async (req, res, next) => {
  try {
    const rows = await exerciseEquipmentService.listForExercise(req.params.exerciseId);
    return res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error('Error fetching exercise equipment:', error);
    return next(error);
  }
};

const createForExercise = async (req, res, next) => {
  try {
    const created = await exerciseEquipmentService.createForExercise(req.params.exerciseId, req.body);
    return res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error linking equipment to exercise:', error);
    return next(error);
  }
};

const updateForExercise = async (req, res, next) => {
  try {
    const row = await exerciseEquipmentService.updateForExercise(req.params.exerciseId, req.params.equipmentId, req.body);
    return res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error updating relation:', error);
    return next(error);
  }
};

const deleteForExercise = async (req, res, next) => {
  try {
    await exerciseEquipmentService.deleteForExercise(req.params.exerciseId, req.params.equipmentId);
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting relation:', error);
    return next(error);
  }
};

module.exports = { listForExercise, createForExercise, updateForExercise, deleteForExercise };
