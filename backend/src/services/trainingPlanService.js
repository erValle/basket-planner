const { StatusCodes } = require('http-status-codes');

const { TrainingPlan, TrainingPlanVersion } = require('../../models');
const errorUtils = require('../libs/errorHelper');
const auditLogService = require('./auditLogService');

const listTrainingPlans = async ({ createdById, targetType, status } = {}) => {
  const where = {};
  if (createdById) where.createdById = createdById;
  if (targetType) where.targetType = targetType;
  if (status) where.status = status;
  return TrainingPlan.findAll({ 
    where,
    include: [
      { model: TrainingPlanVersion, as: 'activeVersion', required: false }
    ],
    order: [['id', 'DESC']]
  });
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

const createTrainingPlan = async (payload, auditCtx = {}) => {
  const created = await TrainingPlan.create(payload);

  await auditLogService.createAuditLog({
    user: auditCtx.user,
    requestId: auditCtx.requestId,
    action: 'training_plan.created',
    entity: 'TrainingPlan',
    entityId: created.id,
    metadata: { name: created.name, targetType: created.targetType, status: created.status },
  });

  return created;
};

const updateTrainingPlan = async (id, payload, auditCtx = {}) => {
  const row = await getTrainingPlanById(id);

  const before = { name: row.name, status: row.status, targetType: row.targetType, createdById: row.createdById };
  await row.update(payload);

  const after = { name: row.name, status: row.status, targetType: row.targetType, createdById: row.createdById };
  await auditLogService.createAuditLog({
    user: auditCtx.user,
    requestId: auditCtx.requestId,
    action: 'training_plan.updated',
    entity: 'TrainingPlan',
    entityId: row.id,
    metadata: { before, after },
  });

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
