const { StatusCodes } = require('http-status-codes');
const { Feedback } = require('../../models');
const logger = require('../middlewares/logger');
const errorUtils = require('../libs/errorHelper');

const listFeedbacks = async (req, res, next) => {
  try {
    const { trainingPlanVersionId, userId } = req.query;
    const where = {};
    if (trainingPlanVersionId) where.trainingPlanVersionId = trainingPlanVersionId;
    if (userId) where.userId = userId;
    const rows = await Feedback.findAll({ where });
    res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error('Error fetching feedbacks:', error);
    return next(error);
  }
};

const getFeedback = async (req, res, next) => {
  try {
    const row = await Feedback.findByPk(req.params.id);
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'FEEDBACK_NOT_FOUND', 'Feedback not found'));
    res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error fetching feedback:', error);
    return next(error);
  }
};

const createFeedback = async (req, res, next) => {
  try {
    const created = await Feedback.create(req.body);
    res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating feedback:', error);
    return next(error);
  }
};

const updateFeedback = async (req, res, next) => {
  try {
    const row = await Feedback.findByPk(req.params.id);
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'FEEDBACK_NOT_FOUND', 'Feedback not found'));
    await row.update(req.body);
    res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error updating feedback:', error);
    return next(error);
  }
};

const deleteFeedback = async (req, res, next) => {
  try {
    const row = await Feedback.findByPk(req.params.id);
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'FEEDBACK_NOT_FOUND', 'Feedback not found'));
    await row.destroy();
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting feedback:', error);
    return next(error);
  }
};

module.exports = { listFeedbacks, getFeedback, createFeedback, updateFeedback, deleteFeedback };
