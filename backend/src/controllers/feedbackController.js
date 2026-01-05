const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const feedbackService = require('../services/feedbackService');

const listFeedbacks = async (req, res, next) => {
  try {
    const rows = await feedbackService.listFeedbacks(req.query);
    return res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error(`Error fetching feedbacks: ${error?.message || error}`);
    return next(error);
  }
};

const getFeedback = async (req, res, next) => {
  try {
    const row = await feedbackService.getFeedbackById(req.params.id);
    return res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error(`Error fetching feedback: ${error?.message || error}`);
    return next(error);
  }
};

const createFeedback = async (req, res, next) => {
  try {
    const created = await feedbackService.createFeedback(req.body, req.user);
    return res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error(`Error creating feedback: ${error?.message || error}`);
    return next(error);
  }
};

const updateFeedback = async (req, res, next) => {
  try {
    const row = await feedbackService.updateFeedback(req.params.id, req.body);
    return res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error(`Error updating feedback: ${error?.message || error}`);
    return next(error);
  }
};

const deleteFeedback = async (req, res, next) => {
  try {
    await feedbackService.deleteFeedback(req.params.id);
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error(`Error deleting feedback: ${error?.message || error}`);
    return next(error);
  }
};

module.exports = { listFeedbacks, getFeedback, createFeedback, updateFeedback, deleteFeedback };
