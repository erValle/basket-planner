const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const trainingPlanVersionService = require('../services/trainingPlanVersionService');

const setActiveVersion = async (req, res, next) => {
  try {
    const plan = await trainingPlanVersionService.setActiveVersion(
      req.params.trainingPlanId,
      req.params.id
    );
    return res.status(StatusCodes.OK).json(plan);
  } catch (error) {
    logger.error('Error setting active training plan version:', error);
    return next(error);
  }
};

module.exports = {
  setActiveVersion
};
