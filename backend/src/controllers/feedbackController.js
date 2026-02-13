const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const feedbackService = require('../services/feedbackService');
const auditLogService = require('../services/auditLogService');

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

    // Registrar en auditoría
    await auditLogService.createAuditLog({
      user: req.user,
      requestId: req.requestId,
      action: 'feedback.create',
      entity: 'Feedback',
      entityId: created.id,
      metadata: {
        trainingPlanVersionId: created.trainingPlanVersionId,
        targetType: created.targetType,
        sessionId: created.sessionId,
        rating: created.rating,
      },
    });

    return res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error(`Error creating feedback: ${error?.message || error}`);
    return next(error);
  }
};

const updateFeedback = async (req, res, next) => {
  try {
    const row = await feedbackService.updateFeedback(req.params.id, req.body);

    // Registrar en auditoría
    await auditLogService.createAuditLog({
      user: req.user,
      requestId: req.requestId,
      action: 'feedback.update',
      entity: 'Feedback',
      entityId: row.id,
      metadata: {
        trainingPlanVersionId: row.trainingPlanVersionId,
        changes: req.body,
      },
    });

    return res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error(`Error updating feedback: ${error?.message || error}`);
    return next(error);
  }
};

const deleteFeedback = async (req, res, next) => {
  try {
    const feedbackId = req.params.id;

    // Obtener el feedback antes de eliminarlo para el audit log
    const feedback = await feedbackService.getFeedbackById(feedbackId);

    await feedbackService.deleteFeedback(feedbackId);

    // Registrar en auditoría
    await auditLogService.createAuditLog({
      user: req.user,
      requestId: req.requestId,
      action: 'feedback.delete',
      entity: 'Feedback',
      entityId: feedbackId,
      metadata: {
        trainingPlanVersionId: feedback.trainingPlanVersionId,
        targetType: feedback.targetType,
        sessionId: feedback.sessionId,
      },
    });

    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error(`Error deleting feedback: ${error?.message || error}`);
    return next(error);
  }
};

const checkCanProvideFeedback = async (req, res, next) => {
  try {
    const result = await feedbackService.canUserProvideFeedback(req.user.id, req.params.versionId);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(`Error checking feedback permission: ${error?.message || error}`);
    return next(error);
  }
};

const getVersionStats = async (req, res, next) => {
  try {
    const stats = await feedbackService.getVersionStats(req.params.versionId);
    return res.status(StatusCodes.OK).json(stats);
  } catch (error) {
    logger.error(`Error getting version stats: ${error?.message || error}`);
    return next(error);
  }
};

const getSessionStats = async (req, res, next) => {
  try {
    const stats = await feedbackService.getSessionStats(req.params.versionId, req.params.sessionId);
    return res.status(StatusCodes.OK).json(stats);
  } catch (error) {
    logger.error(`Error getting session stats: ${error?.message || error}`);
    return next(error);
  }
};

module.exports = {
  listFeedbacks,
  getFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  checkCanProvideFeedback,
  getVersionStats,
  getSessionStats,
};
