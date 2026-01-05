const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const trainingPlanService = require('../services/trainingPlanService');

const listTrainingPlans = async (req, res, next) => {
  try {
    const rows = await trainingPlanService.listTrainingPlans(req.query);
    return res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error('Error fetching training plans:', error);
    return next(error);
  }
};

const getTrainingPlan = async (req, res, next) => {
  try {
    const row = await trainingPlanService.getTrainingPlanById(req.params.id);
    return res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error fetching training plan:', error);
    return next(error);
  }
};

const createTrainingPlan = async (req, res, next) => {
  try {
    const created = await trainingPlanService.createTrainingPlan(req.body, { user: req.user, requestId: req.requestId });
    return res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating training plan:', error);
    return next(error);
  }
};

const updateTrainingPlan = async (req, res, next) => {
  try {
    const row = await trainingPlanService.updateTrainingPlan(req.params.id, req.body, { user: req.user, requestId: req.requestId });
    return res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error updating training plan:', error);
    return next(error);
  }
};

const deleteTrainingPlan = async (req, res, next) => {
  try {
    await trainingPlanService.deleteTrainingPlan(req.params.id);
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting training plan:', error);
    return next(error);
  }
};

module.exports = { listTrainingPlans, getTrainingPlan, createTrainingPlan, updateTrainingPlan, deleteTrainingPlan };
