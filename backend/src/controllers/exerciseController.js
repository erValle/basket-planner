const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const exerciseService = require('../services/exerciseService');

const listExercises = async (req, res, next) => {
  try {
    // Si se envían parámetros de paginación, usar versión paginada
    if (req.query.page || req.query.pageSize) {
      const result = await exerciseService.listExercisesPaginated(req.query);
      return res.status(StatusCodes.OK).json(result);
    }
    
    // Sino, devolver todos (mantener compatibilidad)
    const exercises = await exerciseService.listExercises(req.query);
    return res.status(StatusCodes.OK).json(exercises);
  } catch (error) {
    logger.error('Error fetching exercises:', error);
    return next(error);
  }
};

const getExercise = async (req, res, next) => {
  try {
    const ex = await exerciseService.getExerciseById(req.params.id);
    return res.status(StatusCodes.OK).json(ex);
  } catch (error) {
    logger.error('Error fetching exercise:', error);
    return next(error);
  }
};

const createExercise = async (req, res, next) => {
  try {
    logger.info('Creating exercise with payload:', JSON.stringify(req.body, null, 2));
    const created = await exerciseService.createExercise(req.body);
    logger.info('Exercise created:', JSON.stringify(created, null, 2));
    return res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating exercise:', error);
    return next(error);
  }
};

const updateExercise = async (req, res, next) => {
  try {
    const ex = await exerciseService.updateExercise(req.params.id, req.body);
    return res.status(StatusCodes.OK).json(ex);
  } catch (error) {
    logger.error('Error updating exercise:', error);
    return next(error);
  }
};

const deleteExercise = async (req, res, next) => {
  try {
    await exerciseService.deleteExercise(req.params.id);
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting exercise:', error);
    return next(error);
  }
};

const getPopularTags = async (req, res, next) => {
  try {
    const tags = await exerciseService.getPopularTags();
    return res.status(StatusCodes.OK).json(tags);
  } catch (error) {
    logger.error('Error fetching popular tags:', error);
    return next(error);
  }
};

module.exports = { listExercises, getExercise, createExercise, updateExercise, deleteExercise, getPopularTags };
