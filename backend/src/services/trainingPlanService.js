const { StatusCodes } = require('http-status-codes');

const { TrainingPlan } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listTrainingPlans = async ({ createdById, targetType, status } = {}) => {
  const where = {};
  if (createdById) where.createdById = createdById;
  if (targetType) where.targetType = targetType;
  if (status) where.status = status;
  return TrainingPlan.findAll({ where });
};

const getTrainingPlanById = async (id) => {
  const row = await TrainingPlan.findByPk(id);
  if (!row) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'TRAINING_PLAN_NOT_FOUND', 'Training plan not found');
  }
  return row;
};

const createTrainingPlan = async (payload) => TrainingPlan.create(payload);

const updateTrainingPlan = async (id, payload) => {
  const row = await getTrainingPlanById(id);
  await row.update(payload);
  return row;
};

const deleteTrainingPlan = async (id) => {
  const row = await getTrainingPlanById(id);
  await row.destroy();
};

module.exports = {
  listTrainingPlans,
  getTrainingPlanById,
  createTrainingPlan,
  updateTrainingPlan,
  deleteTrainingPlan,
};
