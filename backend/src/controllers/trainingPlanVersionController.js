const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const trainingPlanVersionService = require('../services/trainingPlanVersionService');

const listVersions = async (req, res, next) => {
  try {
    const rows = await trainingPlanVersionService.listVersions(req.params.trainingPlanId);
    return res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error('Error fetching training plan versions:', error);
    return next(error);
  }
};

const listVersionsPaged = async (req, res, next) => {
  try {
    const result = await trainingPlanVersionService.listVersionsPaged(
      req.params.trainingPlanId,
      req.query
    );
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error('Error fetching training plan versions (paged):', error);
    return next(error);
  }
};

const getVersion = async (req, res, next) => {
  try {
    const row = await trainingPlanVersionService.getVersion(
      req.params.trainingPlanId,
      req.params.id
    );
    return res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error fetching version:', error);
    return next(error);
  }
};

const createVersion = async (req, res, next) => {
  try {
    const created = await trainingPlanVersionService.createVersion(
      req.params.trainingPlanId,
      req.body,
      {
        user: req.user,
        requestId: req.requestId,
      }
    );
    return res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating version:', error);
    return next(error);
  }
};

const updateVersion = async (req, res, next) => {
  try {
    const row = await trainingPlanVersionService.updateVersion(
      req.params.trainingPlanId,
      req.params.id,
      req.body
    );
    return res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error updating version:', error);
    return next(error);
  }
};

const deleteVersion = async (req, res, next) => {
  try {
    await trainingPlanVersionService.deleteVersion(req.params.trainingPlanId, req.params.id);
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting version:', error);
    return next(error);
  }
};

const restoreVersion = async (req, res, next) => {
  try {
    const created = await trainingPlanVersionService.restoreVersion(
      req.params.trainingPlanId,
      req.params.id,
      req.body
    );
    return res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error restoring version:', error);
    return next(error);
  }
};

module.exports = {
  listVersions,
  listVersionsPaged,
  getVersion,
  createVersion,
  updateVersion,
  restoreVersion,
  deleteVersion,
};
