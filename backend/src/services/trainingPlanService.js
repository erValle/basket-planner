const { StatusCodes } = require('http-status-codes');

const { TrainingPlan, TrainingPlanVersion } = require('../../models');
const errorUtils = require('../libs/errorHelper');
const trainingPlanVersionService = require('./trainingPlanVersionService');

const listTrainingPlans = async ({ createdById, targetType, status } = {}) => {
  const where = {};
  if (createdById) where.createdById = createdById;
  if (targetType) where.targetType = targetType;
  if (status) where.status = status;
  return TrainingPlan.findAll({ where });
};

const getTrainingPlanById = async (id) => {
  const row = await TrainingPlan.findByPk(id, {
    include: [
      { model: TrainingPlanVersion, as: 'activeVersion', required: false },
      { model: TrainingPlanVersion, as: 'versions', required: false },
    ],
  });
  if (!row) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'TRAINING_PLAN_NOT_FOUND', 'Training plan not found');
  }
  return row;
};

const createTrainingPlan = async (payload) => TrainingPlan.create(payload);

const updateTrainingPlan = async (id, payload) => {
  const row = await getTrainingPlanById(id);

  const { content, metadata, ...planPatch } = payload || {};

  if (Object.keys(planPatch).length > 0) {
    await row.update(planPatch);
  }

  if (content) {
    await trainingPlanVersionService.createNewVersion(row.id, content, {
      source: 'manual',
      comments: metadata?.comments,
      date: metadata?.date,
    });
  }

  return getTrainingPlanById(id);
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
