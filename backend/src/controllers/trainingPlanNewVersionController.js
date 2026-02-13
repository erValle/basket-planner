const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const trainingPlanVersionService = require('../services/trainingPlanVersionService');


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
