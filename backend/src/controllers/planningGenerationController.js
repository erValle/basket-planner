const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const planningGenerationService = require('../services/planningGenerationService');

const generateIndividual = async (req, res, next) => {
  try {
    const proposal = await planningGenerationService.generateIndividual(req.body, {
      user: req.user,
      requestId: req.requestId
    });
    return res.status(StatusCodes.OK).json(proposal);
  } catch (error) {
    logger.error('Error generating individual planning:', error);
    return next(error);
  }
};

const generateGroup = async (req, res, next) => {
  try {
    const proposal = await planningGenerationService.generateGroup(req.body, {
      user: req.user,
      requestId: req.requestId
    });
    return res.status(StatusCodes.OK).json(proposal);
  } catch (error) {
    logger.error('Error generating group planning:', error);
    return next(error);
  }
};

module.exports = {
  generateIndividual,
  generateGroup
};
