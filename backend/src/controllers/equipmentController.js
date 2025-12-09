const { StatusCodes } = require('http-status-codes');
const { Equipment } = require('../../models');
const logger = require('../middlewares/logger');
const errorUtils = require('../libs/errorHelper');

const listEquipment = async (req, res, next) => {
  try {
    const { clubId } = req.query;
    const where = {};
    if (clubId) where.clubId = clubId;
    const items = await Equipment.findAll({ where });
    res.status(StatusCodes.OK).json(items);
  } catch (error) {
    logger.error('Error fetching equipment:', error);
    return next(error);
  }
};

const getEquipment = async (req, res, next) => {
  try {
    const item = await Equipment.findByPk(req.params.id);
    if (!item) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'EQUIPMENT_NOT_FOUND', 'Equipment not found'));
    res.status(StatusCodes.OK).json(item);
  } catch (error) {
    logger.error('Error fetching equipment:', error);
    return next(error);
  }
};

const createEquipment = async (req, res, next) => {
  try {
    const created = await Equipment.create(req.body);
    res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating equipment:', error);
    return next(error);
  }
};

const updateEquipment = async (req, res, next) => {
  try {
    const item = await Equipment.findByPk(req.params.id);
    if (!item) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'EQUIPMENT_NOT_FOUND', 'Equipment not found'));
    await item.update(req.body);
    res.status(StatusCodes.OK).json(item);
  } catch (error) {
    logger.error('Error updating equipment:', error);
    return next(error);
  }
};

const deleteEquipment = async (req, res, next) => {
  try {
    const item = await Equipment.findByPk(req.params.id);
    if (!item) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'EQUIPMENT_NOT_FOUND', 'Equipment not found'));
    await item.destroy();
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting equipment:', error);
    return next(error);
  }
};

module.exports = { listEquipment, getEquipment, createEquipment, updateEquipment, deleteEquipment };
