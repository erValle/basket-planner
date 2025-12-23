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

const listVersionsPaged = async (trainingPlanId, { page = 1, pageSize = 10 } = {}) => {
  const plan = await getPlan(trainingPlanId);

  const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || 10));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safePageSize;

  const { count: total, rows } = await TrainingPlanVersion.findAndCountAll({
    where: { trainingPlanId },
    order: [['versionNumber', 'DESC']],
    limit: safePageSize,
    offset,
  });

  return {
    page: safePage,
    pageSize: safePageSize,
    total,
    activeVersionId: plan.activeVersionId,
    versions: rows.map((v) => ({
      ...v.toJSON(),
      isActive: plan.activeVersionId === v.id,
    })),
  };
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

const createNewVersion = async (trainingPlanId, content, metadata = {}) => {
  const plan = await getPlan(trainingPlanId);

  const lastVersion = await TrainingPlanVersion.findOne({
    where: { trainingPlanId },
    order: [['versionNumber', 'DESC']],
  });

  const nextVersionNumber = (lastVersion?.versionNumber || 0) + 1;

  const payload = {
    versionNumber: nextVersionNumber,
    source: metadata.source || 'manual',
    date: metadata.date ? new Date(metadata.date) : new Date(),
    comments: metadata.comments ?? null,
    items: content ? structuredClone(content) : null,
  };

  const created = await TrainingPlanVersion.create({ trainingPlanId, ...payload });
  await plan.update({ activeVersionId: created.id });
  return created;
};

const restoreVersion = async (trainingPlanId, versionId, metadata = {}) => {
  const sourceVersion = await getVersion(trainingPlanId, versionId);
  const restoredContent = sourceVersion.items ? structuredClone(sourceVersion.items) : null;

  const comment = [metadata.comments, `restored-from:${sourceVersion.id}`]
    .filter(Boolean)
    .join(' | ');

  return createNewVersion(trainingPlanId, restoredContent, {
    source: metadata.source || 'manual',
    comments: comment || null,
    date: metadata.date,
  });
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
  listVersionsPaged,
  getVersion,
  createVersion,
  createNewVersion,
  restoreVersion,
  updateVersion,
  setActiveVersion,
  deleteVersion,
};
