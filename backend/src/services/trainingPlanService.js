const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');

const { TrainingPlan, TrainingPlanVersion, PlanAssignment, User, UserClub, Club } = require('../../models');
const errorUtils = require('../libs/errorHelper');
const auditLogService = require('./auditLogService');

/**
 * List training plans with optional filters.
 * If userClubIds is provided, only return plans where at least one assigned player belongs to those clubs.
 */
const listTrainingPlans = async ({ createdById, targetType, status, userClubIds } = {}) => {
  const where = {};
  if (createdById) where.createdById = createdById;
  if (targetType) where.targetType = targetType;
  if (status) where.status = status;
  
  const plans = await TrainingPlan.findAll({ 
    where,
    include: [
      { model: TrainingPlanVersion, as: 'activeVersion', required: false },
      { 
        model: PlanAssignment, 
        as: 'assignments', 
        required: false,
        include: [
          { 
            model: User, 
            as: 'user', 
            attributes: ['id', 'firstName', 'lastName', 'email'],
            include: [
              {
                model: UserClub,
                as: 'userClubs',
                where: { endDate: { [Op.is]: null } }, // Solo membresías activas
                required: false,
                include: [
                  { model: Club, as: 'club', attributes: ['id', 'name'] }
                ]
              }
            ]
          }
        ]
      },
      { 
        model: User, 
        as: 'createdBy', 
        attributes: ['id', 'firstName', 'lastName'] 
      }
    ],
    order: [['id', 'DESC']]
  });
  
  // Si se especifican clubIds, filtrar planes donde al menos un jugador asignado pertenezca a esos clubes
  if (userClubIds && userClubIds.length > 0) {
    return plans.filter(plan => {
      if (!plan.assignments || plan.assignments.length === 0) return false;
      
      return plan.assignments.some(assignment => {
        if (!assignment.user || !assignment.user.userClubs) return false;
        return assignment.user.userClubs.some(uc => userClubIds.includes(uc.clubId));
      });
    });
  }
  
  return plans;
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
