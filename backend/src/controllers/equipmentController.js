const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const equipmentService = require('../services/equipmentService');

const listEquipment = async (req, res, next) => {
  try {
    const user = req.user;
    let filteredQuery = { ...req.query };
    
    // Si el usuario no es admin, filtrar por sus clubes asociados
    if (user && user.role !== 'admin') {
      const { Op } = require('sequelize');
      const { UserClub } = require('../../models');
      
      // Obtener los clubes del usuario autenticado (solo membresías activas)
      const userMemberships = await UserClub.findAll({
        where: { 
          userId: user.id,
          endDate: { [Op.is]: null }
        },
        attributes: ['clubId']
      });
      
      const userClubIds = userMemberships.map(m => m.clubId);
      
      // Si el usuario no tiene clubes, devolver lista vacía
      if (userClubIds.length === 0) {
        return res.status(StatusCodes.OK).json([]);
      }
      
      filteredQuery.userClubIds = userClubIds;
    }
    
    const items = await equipmentService.listEquipment(filteredQuery);
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
