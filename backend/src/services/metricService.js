const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');

const { Metric } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const listMetrics = async ({ from, to, page = 1, pageSize = 50 } = {}) => {
  const where = {};

  if (from || to) {
    where.recordedAt = {};
    if (from) where.recordedAt[Op.gte] = new Date(from);
    if (to) where.recordedAt[Op.lte] = new Date(to);
  }

  return Metric.findAll({
    where,
    offset: (Number(page) - 1) * Number(pageSize),
    limit: Number(pageSize),
  });
};

const getMetricById = async (id) => {
  const row = await Metric.findByPk(id);
  if (!row) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'METRIC_NOT_FOUND', 'Metric not found');
  }
  return row;
};

const createMetric = async (payload) => Metric.create(payload);

const deleteMetric = async (id) => {
  const row = await getMetricById(id);
  await row.destroy();
};

module.exports = {
  listMetrics,
  getMetricById,
  createMetric,
  deleteMetric,
};
