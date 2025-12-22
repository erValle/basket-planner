const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const planningService = require('../services/planningService');

const approveGeneratedPlan = async (req, res, next) => {
  try {
    const created = await planningService.approveGeneratedPlan(req.body, req.user);
    return res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error approving generated plan:', error);
    return next(error);
  }
};

module.exports = {
  approveGeneratedPlan
};
