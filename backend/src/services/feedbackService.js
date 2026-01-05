const { StatusCodes } = require('http-status-codes');

const { Feedback } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listFeedbacks = async ({ trainingPlanVersionId, userId } = {}) => {
  const where = {};
  if (trainingPlanVersionId) where.trainingPlanVersionId = trainingPlanVersionId;
  if (userId) where.userId = userId;
  return Feedback.findAll({ where });
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

    const rating = input.rating;

  const payload = {
    trainingPlanVersionId: input.trainingPlanVersionId,
    userId: user.id,
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

module.exports = {
  listFeedbacks,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
};
