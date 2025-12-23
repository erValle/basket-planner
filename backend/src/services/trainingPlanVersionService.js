const { StatusCodes } = require('http-status-codes');

const { TrainingPlan, TrainingPlanVersion } = require('../../models');
const errorUtils = require('../libs/errorHelper');
const auditLogService = require('./auditLogService');

const getPlan = async (trainingPlanId) => {
  const plan = await TrainingPlan.findByPk(trainingPlanId);
  if (!plan) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'TRAINING_PLAN_NOT_FOUND', 'Training plan not found');
  }
  return plan;
};

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

const createVersion = async (trainingPlanId, payload, auditCtx = {}) => {
  const plan = await getPlan(trainingPlanId);

  const created = await TrainingPlanVersion.create({ trainingPlanId, ...payload });

  if (!plan.activeVersionId) {
    await plan.update({ activeVersionId: created.id });
  }

  await auditLogService.createAuditLog({
    user: auditCtx.user,
    requestId: auditCtx.requestId,
    action: 'training_plan_version.created',
    entity: 'TrainingPlanVersion',
    entityId: created.id,
    metadata: { trainingPlanId },
  });

  return created;
};

const setActiveVersion = async (trainingPlanId, versionId, auditCtx = {}) => {
  const plan = await getPlan(trainingPlanId);

  const version = await TrainingPlanVersion.findOne({
    where: { id: versionId, trainingPlanId }
  });

  if (!version) {
    throw errorUtils.httpError(
      StatusCodes.NOT_FOUND,
      'TRAINING_PLAN_VERSION_NOT_FOUND',
      'Version not found'
    );
  }

  await plan.update({ activeVersionId: version.id });

  await auditLogService.createAuditLog({
    user: auditCtx.user,
    requestId: auditCtx.requestId,
    action: 'training_plan_version.activated',
    entity: 'TrainingPlan',
    entityId: plan.id,
    metadata: { activeVersionId: version.id, trainingPlanId },
  });
  return plan;
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
  setActiveVersion,
  deleteVersion,
};
