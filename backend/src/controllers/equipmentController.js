const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const equipmentService = require('../services/equipmentService');

const listEquipment = async (req, res, next) => {
  try {
    const items = await equipmentService.listEquipment(req.query);
    return res.status(StatusCodes.OK).json(items);
  } catch (error) {
    logger.error('Error fetching equipment:', error);
    return next(error);
  }
};

const getEquipment = async (req, res, next) => {
  try {
    const item = await equipmentService.getEquipmentById(req.params.id);
    return res.status(StatusCodes.OK).json(item);
  } catch (error) {
    logger.error('Error fetching equipment:', error);
    return next(error);
  }
};

const createEquipment = async (req, res, next) => {
  try {
    const created = await equipmentService.createEquipment(req.body);
    return res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating equipment:', error);
    return next(error);
  }
};

const updateEquipment = async (req, res, next) => {
  try {
    const item = await equipmentService.updateEquipment(req.params.id, req.body);
    return res.status(StatusCodes.OK).json(item);
  } catch (error) {
    logger.error('Error updating equipment:', error);
    return next(error);
  }
};

const deleteEquipment = async (req, res, next) => {
  try {
    await equipmentService.deleteEquipment(req.params.id);
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting equipment:', error);
    return next(error);
  }
};

module.exports = { listEquipment, getEquipment, createEquipment, updateEquipment, deleteEquipment };
