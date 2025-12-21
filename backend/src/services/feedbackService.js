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

const createFeedback = async (payload) => Feedback.create(payload);

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
