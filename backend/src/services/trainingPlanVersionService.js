const { StatusCodes } = require('http-status-codes');

const { TrainingPlanVersion } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listVersions = async (trainingPlanId) => {
  return TrainingPlanVersion.findAll({ where: { trainingPlanId } });
};

const getVersion = async (trainingPlanId, id) => {
  const row = await TrainingPlanVersion.findOne({ where: { id, trainingPlanId } });
  if (!row) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'TRAINING_PLAN_VERSION_NOT_FOUND', 'Version not found');
  }
  return row;
};

const createVersion = async (trainingPlanId, payload) => {
  return TrainingPlanVersion.create({ trainingPlanId, ...payload });
};

const updateVersion = async (trainingPlanId, id, payload) => {
  const row = await getVersion(trainingPlanId, id);
  await row.update(payload);
  return row;
};

const deleteVersion = async (trainingPlanId, id) => {
  const row = await getVersion(trainingPlanId, id);
  await row.destroy();
};

module.exports = {
  listVersions,
  getVersion,
  createVersion,
  updateVersion,
  deleteVersion,
};
