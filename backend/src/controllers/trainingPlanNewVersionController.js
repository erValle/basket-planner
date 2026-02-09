const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const trainingPlanVersionService = require('../services/trainingPlanVersionService');

/**
 * POST /api/training-plans/:trainingPlanId/versions/new
 * Creates a new version using the backend helper that auto-increments versionNumber
 * and sets the plan's activeVersionId.
 *
 * Body:
 * {
 *   sessions?: object,
 *   source?: 'manual'|'automatic'|string,
 *   date?: string|Date,
 *   comments?: string|null,
 *   createdFrom?: object
 * }
 */
const createNewVersion = async (req, res, next) => {
  try {
    const created = await trainingPlanVersionService.createNewVersion(
      req.params.trainingPlanId,
      req.body?.sessions ?? null,
      {
        source: req.body?.source,
        date: req.body?.date,
        comments: req.body?.comments,
        createdFrom: req.body?.createdFrom,
      }
    );

    return res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating new training plan version:', error);
    return next(error);
  }
};

module.exports = { createNewVersion };
