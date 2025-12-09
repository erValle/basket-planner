const { StatusCodes } = require('http-status-codes');
const { Exercise, Equipment, ExerciseEquipment } = require('../../models');
const logger = require('../middlewares/logger');
const errorUtils = require('../libs/errorHelper');
const { Op } = require('sequelize');

const listExercises = async (req, res, next) => {
  try {
    const { type, difficulty, tags } = req.query;
    const where = {};
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (tags) where.tags = { [Op.contains]: Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()) };
    const exercises = await Exercise.findAll({ where });
    res.status(StatusCodes.OK).json(exercises);
  } catch (error) {
    logger.error('Error fetching exercises:', error);
    return next(error);
  }
};

const getExercise = async (req, res, next) => {
  try {
    const ex = await Exercise.findByPk(req.params.id, {
      include: [{
        model: Equipment,
        through: { attributes: ['quantity'] }
      }]
    });
    if (!ex) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_NOT_FOUND', 'Exercise not found'));
    res.status(StatusCodes.OK).json(ex);
  } catch (error) {
    logger.error('Error fetching exercise:', error);
    return next(error);
  }
};

const createExercise = async (req, res, next) => {
  try {
    const created = await Exercise.create(req.body);
    res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating exercise:', error);
    return next(error);
  }
};

const updateExercise = async (req, res, next) => {
  try {
    const ex = await Exercise.findByPk(req.params.id);
    if (!ex) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_NOT_FOUND', 'Exercise not found'));
    await ex.update(req.body);
    res.status(StatusCodes.OK).json(ex);
  } catch (error) {
    logger.error('Error updating exercise:', error);
    return next(error);
  }
};

const deleteExercise = async (req, res, next) => {
  try {
    const ex = await Exercise.findByPk(req.params.id);
    if (!ex) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_NOT_FOUND', 'Exercise not found'));
    await ex.destroy();
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting exercise:', error);
    return next(error);
  }
};

module.exports = { listExercises, getExercise, createExercise, updateExercise, deleteExercise };
