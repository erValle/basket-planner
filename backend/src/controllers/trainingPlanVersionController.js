const { StatusCodes } = require('http-status-codes');
const { TrainingPlanVersion } = require('../../models');
const logger = require('../middlewares/logger');
const errorUtils = require('../libs/errorHelper');

const listVersions = async (req, res, next) => {
  try {
    const rows = await TrainingPlanVersion.findAll({ where: { trainingPlanId: req.params.trainingPlanId } });
    res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error('Error fetching training plan versions:', error);
    return next(error);
  }
};

const getVersion = async (req, res, next) => {
  try {
    const row = await TrainingPlanVersion.findOne({ where: { id: req.params.id, trainingPlanId: req.params.trainingPlanId } });
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'TRAINING_PLAN_VERSION_NOT_FOUND', 'Version not found'));
    res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error fetching version:', error);
    return next(error);
  }
};

const createVersion = async (req, res, next) => {
  try {
    const created = await TrainingPlanVersion.create({ trainingPlanId: req.params.trainingPlanId, ...req.body });
    res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating version:', error);
    return next(error);
  }
};

const updateVersion = async (req, res, next) => {
  try {
    const row = await TrainingPlanVersion.findOne({ where: { id: req.params.id, trainingPlanId: req.params.trainingPlanId } });
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'TRAINING_PLAN_VERSION_NOT_FOUND', 'Version not found'));
    await row.update(req.body);
    res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error updating version:', error);
    return next(error);
  }
};

const deleteVersion = async (req, res, next) => {
  try {
    const row = await TrainingPlanVersion.findOne({ where: { id: req.params.id, trainingPlanId: req.params.trainingPlanId } });
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'TRAINING_PLAN_VERSION_NOT_FOUND', 'Version not found'));
    await row.destroy();
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting version:', error);
    return next(error);
  }
};

module.exports = { listVersions, getVersion, createVersion, updateVersion, deleteVersion };
