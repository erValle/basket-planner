const { StatusCodes } = require('http-status-codes');
const { PlanAssignment } = require('../../models');
const logger = require('../middlewares/logger');
const errorUtils = require('../libs/errorHelper');

const listAssignments = async (req, res, next) => {
  try {
    const { userId, trainingPlanId, status } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (trainingPlanId) where.trainingPlanId = trainingPlanId;
    if (status) where.status = status;
    const rows = await PlanAssignment.findAll({ where });
    res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error('Error fetching assignments:', error);
    return next(error);
  }
};

const getAssignment = async (req, res, next) => {
  try {
    const row = await PlanAssignment.findByPk(req.params.id);
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'PLAN_ASSIGNMENT_NOT_FOUND', 'Assignment not found'));
    res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error fetching assignment:', error);
    return next(error);
  }
};

const createAssignment = async (req, res, next) => {
  try {
    const created = await PlanAssignment.create(req.body);
    res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating assignment:', error);
    return next(error);
  }
};

const updateAssignment = async (req, res, next) => {
  try {
    const row = await PlanAssignment.findByPk(req.params.id);
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'PLAN_ASSIGNMENT_NOT_FOUND', 'Assignment not found'));
    await row.update(req.body);
    res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error updating assignment:', error);
    return next(error);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const row = await PlanAssignment.findByPk(req.params.id);
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'PLAN_ASSIGNMENT_NOT_FOUND', 'Assignment not found'));
    await row.destroy();
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting assignment:', error);
    return next(error);
  }
};

const listAssignmentsForUser = async (req, res, next) => {
  try {
    const rows = await PlanAssignment.findAll({ where: { userId: req.params.userId } });
    res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error('Error fetching user assignments:', error);
    return next(error);
  }
};

const listAssignmentsForPlan = async (req, res, next) => {
  try {
    const rows = await PlanAssignment.findAll({ where: { trainingPlanId: req.params.trainingPlanId } });
    res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error('Error fetching plan assignments:', error);
    return next(error);
  }
};

module.exports = { listAssignments, getAssignment, createAssignment, updateAssignment, deleteAssignment, listAssignmentsForUser, listAssignmentsForPlan };
