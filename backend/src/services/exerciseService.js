const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');

const { Exercise, Equipment } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listExercises = async ({ type, difficulty, tags } = {}) => {
  const where = {};
  if (type) where.type = type;
  if (difficulty) where.difficulty = difficulty;
  if (tags) {
    const parsed = Array.isArray(tags)
      ? tags
      : String(tags)
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
    where.tags = { [Op.contains]: parsed };
  }
  return Exercise.findAll({ where });
};

const getExerciseById = async (id) => {
  const ex = await Exercise.findByPk(id, {
    include: [{ model: Equipment, through: { attributes: ['quantity'] } }],
  });
  if (!ex) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_NOT_FOUND', 'Exercise not found');
  }
  return ex;
};

const createExercise = async (payload) => Exercise.create(payload);

const updateExercise = async (id, payload) => {
  const ex = await Exercise.findByPk(id);
  if (!ex) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_NOT_FOUND', 'Exercise not found');
  }
  await ex.update(payload);
  return ex;
};

const deleteExercise = async (id) => {
  const ex = await Exercise.findByPk(id);
  if (!ex) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'EXERCISE_NOT_FOUND', 'Exercise not found');
  }
  await ex.destroy();
};

module.exports = {
  listExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
};
