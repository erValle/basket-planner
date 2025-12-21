const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const planAssignmentService = require('../services/planAssignmentService');

const listAssignments = async (req, res, next) => {
  try {
    const rows = await planAssignmentService.listAssignments(req.query);
    return res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error('Error fetching assignments:', error);
    return next(error);
  }
};

const getAssignment = async (req, res, next) => {
  try {
    const row = await planAssignmentService.getAssignmentById(req.params.id);
    return res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error fetching assignment:', error);
    return next(error);
  }
};

const createAssignment = async (req, res, next) => {
  try {
    const created = await planAssignmentService.createAssignment(req.body);
    return res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating assignment:', error);
    return next(error);
  }
};

const updateAssignment = async (req, res, next) => {
  try {
    const row = await planAssignmentService.updateAssignment(req.params.id, req.body);
    return res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error updating assignment:', error);
    return next(error);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    await planAssignmentService.deleteAssignment(req.params.id);
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting assignment:', error);
    return next(error);
  }
};

const listAssignmentsForUser = async (req, res, next) => {
  try {
    const rows = await planAssignmentService.listAssignmentsForUser(req.params.userId);
    return res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error('Error fetching user assignments:', error);
    return next(error);
  }
};

const listAssignmentsForPlan = async (req, res, next) => {
  try {
    const rows = await planAssignmentService.listAssignmentsForPlan(req.params.trainingPlanId);
    return res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error('Error fetching plan assignments:', error);
    return next(error);
  }
};

module.exports = { listAssignments, getAssignment, createAssignment, updateAssignment, deleteAssignment, listAssignmentsForUser, listAssignmentsForPlan };
