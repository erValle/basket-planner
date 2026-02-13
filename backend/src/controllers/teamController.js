const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const teamService = require('../services/teamService');

const listTeams = async (req, res, next) => {
  try {
    const user = req.user;
    let filteredQuery = { ...req.query };

    // Si el usuario no es admin, filtrar por sus clubes
    if (user && user.role !== 'admin') {
      const { Op } = require('sequelize');
      const { UserClub } = require('../../models');

      // Obtener los clubes del usuario autenticado (solo membresías activas)
      const userMemberships = await UserClub.findAll({
        where: {
          userId: user.id,
          endDate: { [Op.is]: null },
        },
        attributes: ['clubId'],
      });

      const userClubIds = userMemberships.map((m) => m.clubId);

      // Si el usuario no tiene clubes, devolver lista vacía
      if (userClubIds.length === 0) {
        return res.status(StatusCodes.OK).json([]);
      }

      filteredQuery.userClubIds = userClubIds;
    }

    const teams = await teamService.listTeams(filteredQuery);
    return res.status(StatusCodes.OK).json(teams);
  } catch (error) {
    logger.error('Error fetching teams:', error);
    return next(error);
  }
};

const getTeam = async (req, res, next) => {
  try {
    const team = await teamService.getTeamById(req.params.id);
    return res.status(StatusCodes.OK).json(team);
  } catch (error) {
    logger.error('Error fetching team:', error);
    return next(error);
  }
};

const createTeam = async (req, res, next) => {
  try {
    const team = await teamService.createTeam(req.body);
    return res.status(StatusCodes.CREATED).json(team);
  } catch (error) {
    logger.error('Error creating team:', error);
    return next(error);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const team = await teamService.updateTeam(req.params.id, req.body);
    return res.status(StatusCodes.OK).json(team);
  } catch (error) {
    logger.error('Error updating team:', error);
    return next(error);
  }
};

const deleteTeam = async (req, res, next) => {
  try {
    await teamService.deleteTeam(req.params.id);
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting team:', error);
    return next(error);
  }
};

module.exports = { listTeams, getTeam, createTeam, updateTeam, deleteTeam };
