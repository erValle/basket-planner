const { StatusCodes } = require('http-status-codes');

const { PlanAssignment, TrainingPlan, User } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listAssignments = async ({ userId, trainingPlanId, status } = {}) => {
  const where = {};
  if (userId) where.userId = userId;
  if (trainingPlanId) where.trainingPlanId = trainingPlanId;
  if (status) where.status = status;
  return PlanAssignment.findAll({
    where,
    include: [
      { model: TrainingPlan, as: 'trainingPlan', required: false },
      { model: User, as: 'user', required: false },
    ],
  });
};

const getAssignmentById = async (id) => {
  const row = await PlanAssignment.findByPk(id, {
    include: [
      { model: TrainingPlan, as: 'trainingPlan', required: false },
      { model: User, as: 'user', required: false },
    ],
  });
  if (!row) {
    throw errorUtils.httpError(
      StatusCodes.NOT_FOUND,
      'PLAN_ASSIGNMENT_NOT_FOUND',
      'Assignment not found'
    );
  }
  return row;
};

const createAssignment = async (payload) => PlanAssignment.create(payload);

const updateAssignment = async (id, payload) => {
  const row = await getAssignmentById(id);
  await row.update(payload);
  return row;
};

const deleteAssignment = async (id) => {
  const row = await getAssignmentById(id);
  await row.destroy();
};

const listAssignmentsForUser = async (userId) => {
  return PlanAssignment.findAll({
    where: { userId },
    include: [{ model: TrainingPlan, as: 'trainingPlan', required: false }],
    order: [['assignedAt', 'DESC']],
  });
};

const listAssignmentsForPlan = async (trainingPlanId) => {
  return PlanAssignment.findAll({
    where: { trainingPlanId },
    include: [{ model: User, as: 'user', required: false }],
    order: [['assignedAt', 'DESC']],
  });
};

module.exports = {
  listAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  listAssignmentsForUser,
  listAssignmentsForPlan,
};
