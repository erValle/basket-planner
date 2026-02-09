const { StatusCodes } = require('http-status-codes');

const {
  Feedback,
  PlanAssignment,
  TrainingPlanVersion,
  TrainingPlan,
  User,
} = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listFeedbacks = async ({ trainingPlanVersionId, userId, sessionId, targetType } = {}) => {
  const where = {};
  if (trainingPlanVersionId) where.trainingPlanVersionId = trainingPlanVersionId;
  if (userId) where.userId = userId;
  if (sessionId) where.sessionId = sessionId;
  if (targetType) where.targetType = targetType;

  return Feedback.findAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: TrainingPlanVersion,
        as: 'trainingPlanVersion',
        include: [
          {
            model: TrainingPlan,
            as: 'trainingPlan',
            attributes: ['id', 'name'],
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
};

const getFeedbackById = async (id) => {
  const row = await Feedback.findByPk(id);
  if (!row) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'FEEDBACK_NOT_FOUND', 'Feedback not found');
  }
  return row;
};

const createFeedback = async (input, user) => {
  if (!user || !user.id) {
    throw errorUtils.httpError(StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED', 'User is required');
  }

  if (!input || typeof input !== 'object') {
    throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'INVALID_INPUT', 'Input must be an object');
  }

  if (!input.trainingPlanVersionId) {
    throw errorUtils.httpError(
      StatusCodes.BAD_REQUEST,
      'INVALID_TRAINING_PLAN_VERSION',
      'trainingPlanVersionId is required'
    );
  }

  // Validate that the version exists
  const version = await TrainingPlanVersion.findByPk(input.trainingPlanVersionId);
  if (!version) {
    throw errorUtils.httpError(
      StatusCodes.NOT_FOUND,
      'VERSION_NOT_FOUND',
      'Training plan version not found'
    );
  }

  // Check if user has this plan assigned
  const assignment = await PlanAssignment.findOne({
    where: {
      userId: user.id,
      trainingPlanId: version.trainingPlanId,
    },
  });

  if (!assignment) {
    throw errorUtils.httpError(
      StatusCodes.FORBIDDEN,
      'PLAN_NOT_ASSIGNED',
      'You can only provide feedback for assigned training plans'
    );
  }

  // If assignment has a specific version, validate it matches
  if (
    assignment.trainingPlanVersionId &&
    assignment.trainingPlanVersionId !== input.trainingPlanVersionId
  ) {
    throw errorUtils.httpError(
      StatusCodes.FORBIDDEN,
      'VERSION_MISMATCH',
      'You can only provide feedback for your assigned version'
    );
  }

  const rating = input.rating;
  const targetType = input.targetType || 'version';
  const sessionId = input.sessionId || null;

  // Validate sessionId is provided for session-level feedback
  if (targetType === 'session' && !sessionId) {
    throw errorUtils.httpError(
      StatusCodes.BAD_REQUEST,
      'SESSION_ID_REQUIRED',
      'sessionId is required for session-level feedback'
    );
  }

  const payload = {
    trainingPlanVersionId: input.trainingPlanVersionId,
    userId: user.id,
    targetType,
    sessionId,
    rating,
    comments: input.comments ?? null,
  };

  return Feedback.create(payload);
};

const updateFeedback = async (id, payload) => {
  const row = await getFeedbackById(id);
  await row.update(payload);
  return row;
};

const deleteFeedback = async (id) => {
  const row = await getFeedbackById(id);
  await row.destroy();
};

/**
 * Check if a user can provide feedback for a specific training plan version
 */
const canUserProvideFeedback = async (userId, trainingPlanVersionId) => {
  const version = await TrainingPlanVersion.findByPk(trainingPlanVersionId);
  if (!version) {
    return { canFeedback: false, reason: 'Version not found' };
  }

  const assignment = await PlanAssignment.findOne({
    where: {
      userId,
      trainingPlanId: version.trainingPlanId,
    },
  });

  if (!assignment) {
    return { canFeedback: false, reason: 'Plan not assigned to user' };
  }

  // If assignment has a specific version, validate it matches
  if (
    assignment.trainingPlanVersionId &&
    assignment.trainingPlanVersionId !== trainingPlanVersionId
  ) {
    return { canFeedback: false, reason: 'Different version assigned' };
  }

  return { canFeedback: true, assignment };
};

/**
 * Get aggregated statistics for a training plan version
 */
const getVersionStats = async (trainingPlanVersionId) => {
  const feedbacks = await Feedback.findAll({
    where: { trainingPlanVersionId, targetType: 'version' },
  });

  if (feedbacks.length === 0) {
    return {
      count: 0,
      averages: {},
      distribution: {},
    };
  }

  // Calculate averages for numeric rating fields
  const ratingKeys = new Set();
  feedbacks.forEach((f) => {
    if (f.rating && typeof f.rating === 'object') {
      Object.keys(f.rating).forEach((k) => ratingKeys.add(k));
    }
  });

  const averages = {};
  const distribution = {};

  ratingKeys.forEach((key) => {
    const values = feedbacks.map((f) => f.rating?.[key]).filter((v) => typeof v === 'number');

    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      averages[key] = (sum / values.length).toFixed(2);

      // Calculate distribution (for 1-10 scales)
      distribution[key] = {};
      values.forEach((v) => {
        distribution[key][v] = (distribution[key][v] || 0) + 1;
      });
    }
  });

  return {
    count: feedbacks.length,
    averages,
    distribution,
    feedbacks: feedbacks.map((f) => ({
      id: f.id,
      userId: f.userId,
      rating: f.rating,
      comments: f.comments,
      createdAt: f.createdAt,
    })),
  };
};

/**
 * Get aggregated statistics for a specific session
 */
const getSessionStats = async (trainingPlanVersionId, sessionId) => {
  const feedbacks = await Feedback.findAll({
    where: { trainingPlanVersionId, sessionId, targetType: 'session' },
  });

  if (feedbacks.length === 0) {
    return {
      count: 0,
      averages: {},
    };
  }

  // Calculate averages (same logic as version stats)
  const ratingKeys = new Set();
  feedbacks.forEach((f) => {
    if (f.rating && typeof f.rating === 'object') {
      Object.keys(f.rating).forEach((k) => ratingKeys.add(k));
    }
  });

  const averages = {};
  ratingKeys.forEach((key) => {
    const values = feedbacks.map((f) => f.rating?.[key]).filter((v) => typeof v === 'number');

    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      averages[key] = (sum / values.length).toFixed(2);
    }
  });

  return {
    count: feedbacks.length,
    sessionId,
    averages,
    feedbacks: feedbacks.map((f) => ({
      id: f.id,
      userId: f.userId,
      rating: f.rating,
      comments: f.comments,
      createdAt: f.createdAt,
    })),
  };
};

module.exports = {
  listFeedbacks,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  canUserProvideFeedback,
  getVersionStats,
  getSessionStats,
};
