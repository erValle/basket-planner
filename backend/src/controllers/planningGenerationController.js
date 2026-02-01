const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const planningGenerationService = require('../services/planningGenerationService');

// Timeout aumentado ya que la generación es rápida (~100ms)
// El timeout es solo seguridad para casos extremos
const GENERATION_TIMEOUT_MS = 60000; // 60 segundos

const generateIndividual = async (req, res, next) => {
  try {
    console.log('📥 [Controller] Recibida solicitud de generación individual');
    
    const proposal = await planningGenerationService.generateIndividual(
      req.body,
      { user: req.user, requestId: req.requestId },
      {} // Sin AbortSignal - la generación es muy rápida
    );
    
    console.log('📤 [Controller] Generación completada');
    
    if (!proposal || proposal.success === false) {
      return res.status(StatusCodes.OK).json({
        success: false,
        message: proposal?.message || 'No se pudo generar la planificación',
        wasAborted: proposal?.wasAborted || false
      });
    }
    
    return res.status(StatusCodes.OK).json(proposal);
    
  } catch (error) {
    logger.error('Error generating individual planning:', error);
    return next(error);
  }
};

const generateGroup = async (req, res, next) => {
  try {
    console.log('📥 [Controller] Recibida solicitud de generación grupal');
    
    const proposal = await planningGenerationService.generateGroup(
      req.body,
      { user: req.user, requestId: req.requestId },
      {} // Sin AbortSignal
    );
    
    console.log('📤 [Controller] Generación grupal completada');
    
    if (!proposal || proposal.success === false) {
      return res.status(StatusCodes.OK).json({
        success: false,
        message: proposal?.message || 'No se pudo generar la planificación',
        wasAborted: proposal?.wasAborted || false
      });
    }
    
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