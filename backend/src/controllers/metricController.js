const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const metricService = require('../services/metricService');

const listMetrics = async (req, res, next) => {
  try {
    const rows = await metricService.listMetrics(req.query);
    return res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error('Error fetching metrics:', error);
    return next(error);
  }
};

const getMetric = async (req, res, next) => {
  try {
    const row = await metricService.getMetricById(req.params.id);
    return res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error fetching metric:', error);
    return next(error);
  }
};

const createMetric = async (req, res, next) => {
  try {
    const created = await metricService.createMetric(req.body);
    return res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating metric:', error);
    return next(error);
  }
};

const updateMetric = async (req, res, next) => {
  try {
    const row = await metricService.updateMetric(req.params.id, req.body);
    return res.status(StatusCodes.OK).json(row);
  } catch (error) {
    logger.error('Error updating metric:', error);
    return next(error);
  }
};

const deleteMetric = async (req, res, next) => {
  try {
    await metricService.deleteMetric(req.params.id);
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting metric:', error);
    return next(error);
  }
};

module.exports = { listMetrics, getMetric, createMetric, updateMetric, deleteMetric };
