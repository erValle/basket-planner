const { StatusCodes } = require('http-status-codes');
const { Metric } = require('../../models');
const logger = require('../middlewares/logger');
const errorUtils = require('../libs/errorHelper');

const listMetrics = async (req, res, next) => {
  try {
    const { from, to, page = 1, pageSize = 50 } = req.query;
    const where = {};
    if (from || to) {
      where.recordedAt = {};
      if (from) where.recordedAt['$gte'] = new Date(from);
      if (to) where.recordedAt['$lte'] = new Date(to);
    }
    const rows = await Metric.findAll({ where, offset: (page - 1) * pageSize, limit: pageSize });
    res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error('Error fetching metrics:', error);
    return next(error);
  }
};

const getMetric = async (req, res, next) => {
  try {
    const row = await Metric.findByPk(req.params.id);
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'METRIC_NOT_FOUND', 'Metric not found'));
    res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error fetching metric:', error);
    return next(error);
  }
};

const createMetric = async (req, res, next) => {
  try {
    const created = await Metric.create(req.body);
    res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating metric:', error);
    return next(error);
  }
};

const deleteMetric = async (req, res, next) => {
  try {
    const row = await Metric.findByPk(req.params.id);
    if (!row) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'METRIC_NOT_FOUND', 'Metric not found'));
    await row.destroy();
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting metric:', error);
    return next(error);
  }
};

module.exports = { listMetrics, getMetric, createMetric, deleteMetric };
