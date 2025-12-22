const { StatusCodes } = require('http-status-codes');

const { TrainingPlan, TrainingPlanVersion } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const validateApproveInput = (input) => {
  if (!input || typeof input !== 'object') {
    throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'INVALID_INPUT', 'Input must be an object');
  }

  if (!input.proposal || typeof input.proposal !== 'object') {
    throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'INVALID_PROPOSAL', 'proposal is required');
  }

  if (!Array.isArray(input.proposal.sessions) || input.proposal.sessions.length === 0) {
    throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'INVALID_PROPOSAL', 'proposal.sessions is required');
  }

  if (!input.plan || typeof input.plan !== 'object') {
    throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'INVALID_PLAN', 'plan is required');
  }

  if (!input.plan.name) {
    throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'INVALID_PLAN', 'plan.name is required');
  }
};

const approveGeneratedPlan = async (input, user) => {
  validateApproveInput(input);

  if (!user || !user.id) {
    throw errorUtils.httpError(StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED', 'User is required');
  }

  const createdById = user.id;
  const now = new Date();

  const planPayload = {
    createdById,
    targetType: input.plan.targetType || 'user',
    name: input.plan.name,
    description: input.plan.description ?? null,
    goal: input.plan.goal ?? null,
    type: input.plan.type ?? null,
    intensity: input.plan.intensity ?? null,
    duration: input.plan.duration ?? null,
    status: input.plan.status || 'draft'
  };

  const plan = await TrainingPlan.create(planPayload);

  const versionPayload = {
    trainingPlanId: plan.id,
    versionNumber: 1,
    source: 'automatic',
    date: now,
    comments: null,
    items: input.proposal
  };

  const version = await TrainingPlanVersion.create(versionPayload);

  if (typeof plan.update === 'function') {
    await plan.update({ activeVersionId: version.id });
  }

  const planWithActive = await TrainingPlan.findByPk(plan.id, {
    include: [{ model: TrainingPlanVersion, as: 'activeVersion', required: false }]
  });

  return planWithActive || plan;
};

module.exports = {
  approveGeneratedPlan
};
