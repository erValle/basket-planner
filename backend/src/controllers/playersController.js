const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const playersService = require('../services/playersService');
const userClubService = require('../services/userClubService');

const listPlayers = async (req, res, next) => {
  try {
    const user = req.user;
    let filteredQuery = { ...req.query };
    
    // Si el usuario no es admin, necesitamos filtrar por sus clubes
    if (user && user.role !== 'admin') {
      const userClubService = require('../services/userClubService');
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
      
      // Si el usuario tiene múltiples clubes (technical_director), necesitamos filtrar manualmente
      // Si solo tiene un club (coach), podemos usar el filtro directo
      filteredQuery.userClubIds = userClubIds;
    }
    
    const rows = await playersService.listPlayers(filteredQuery);
    return res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error(`Error fetching players: ${error?.message || error}`);
    return next(error);
  }
};

const getPlayerHistory = async (req, res, next) => {
  try {
    const rows = await playersService.getPlayerHistory(req.params.id);
    return res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error(`Error fetching player history: ${error?.message || error}`);
    return next(error);
  }
};

const transferPlayer = async (req, res, next) => {
  try {
    const result = await userClubService.transferPlayerToClub(Number(req.params.id), req.body);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(`Error transferring player: ${error?.message || error}`);
    logger.error('Request body was:', req.body);
    logger.error('Error details:', {
      name: error.name,
      message: error.message,
      errors: error.errors,
      original: error.original
    });
    return next(error);
  }
};

const enrollPlayer = async (req, res, next) => {
  try {
    const result = await playersService.enrollExistingUserAsPlayer(req.user, req.body);
    return res.status(StatusCodes.CREATED).json(result);
  } catch (error) {
    logger.error(`Error enrolling player: ${error?.message || error}`);
    return next(error);
  }
};

const updatePlayerProfile = async (req, res, next) => {
  try {
    const result = await playersService.updatePlayerProfile(Number(req.params.id), req.body);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error(`Error updating player profile: ${error?.message || error}`);
    return next(error);
  }
};

module.exports = { listPlayers, getPlayerHistory, transferPlayer, enrollPlayer, updatePlayerProfile };
