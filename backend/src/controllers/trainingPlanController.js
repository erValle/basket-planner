const { StatusCodes } = require('http-status-codes');
const { TrainingPlan } = require('../../models');
const logger = require('../middlewares/logger');
const errorUtils = require('../libs/errorHelper');

const listTrainingPlans = async (req, res, next) => {
  try {
    const { createdById, targetType, status } = req.query;
    const where = {};
    if (createdById) where.createdById = createdById;
    if (targetType) where.targetType = targetType;
    if (status) where.status = status;
    const rows = await TrainingPlan.findAll({ where });
    res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error('Error fetching training plans:', error);
    return next(error);
  }
};

const getTrainingPlan = async (req, res, next) => {
  try {
    const row = await TrainingPlan.findByPk(req.params.id);
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'TRAINING_PLAN_NOT_FOUND', 'Training plan not found'));
    res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error fetching training plan:', error);
    return next(error);
  }
};

const createTrainingPlan = async (req, res, next) => {
  try {
    const created = await TrainingPlan.create(req.body);
    res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating training plan:', error);
    return next(error);
  }
};

const updateTrainingPlan = async (req, res, next) => {
  try {
    const row = await TrainingPlan.findByPk(req.params.id);
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'TRAINING_PLAN_NOT_FOUND', 'Training plan not found'));
    await row.update(req.body);
    res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error updating training plan:', error);
    return next(error);
  }
};

const deleteTrainingPlan = async (req, res, next) => {
  try {
    const row = await TrainingPlan.findByPk(req.params.id);
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'TRAINING_PLAN_NOT_FOUND', 'Training plan not found'));
    await row.destroy();
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting training plan:', error);
    return next(error);
  }
};

module.exports = { listTrainingPlans, getTrainingPlan, createTrainingPlan, updateTrainingPlan, deleteTrainingPlan };
