const { StatusCodes } = require('http-status-codes');

const { PlanAssignment } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listAssignments = async ({ userId, trainingPlanId, status } = {}) => {
  const where = {};
  if (userId) where.userId = userId;
  if (trainingPlanId) where.trainingPlanId = trainingPlanId;
  if (status) where.status = status;
  return PlanAssignment.findAll({ where });
};

const getAssignmentById = async (id) => {
  const row = await PlanAssignment.findByPk(id);
  if (!row) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'PLAN_ASSIGNMENT_NOT_FOUND', 'Assignment not found');
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
  return PlanAssignment.findAll({ where: { userId } });
};

const listAssignmentsForPlan = async (trainingPlanId) => {
  return PlanAssignment.findAll({ where: { trainingPlanId } });
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
