const { StatusCodes } = require('http-status-codes');
const { Team } = require('../../models');
const logger = require('../middlewares/logger');
const errorUtils = require('../libs/errorHelper');

const listTeams = async (req, res, next) => {
  try {
    const { clubId } = req.query;
    const where = {};
    if (clubId) where.clubId = clubId;
    const teams = await Team.findAll({ where });
    res.status(StatusCodes.OK).json(teams);
  } catch (error) {
    logger.error('Error fetching teams:', error);
    return next(error);
  }
};

const getTeam = async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'TEAM_NOT_FOUND', 'Team not found'));
    res.status(StatusCodes.OK).json(team);
  } catch (error) {
    logger.error('Error fetching team:', error);
    return next(error);
  }
};

const createTeam = async (req, res, next) => {
  try {
    const team = await Team.create(req.body);
    res.status(StatusCodes.CREATED).json(team);
  } catch (error) {
    logger.error('Error creating team:', error);
    return next(error);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'TEAM_NOT_FOUND', 'Team not found'));
    await team.update(req.body);
    res.status(StatusCodes.OK).json(team);
  } catch (error) {
    logger.error('Error updating team:', error);
    return next(error);
  }
};

const deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'TEAM_NOT_FOUND', 'Team not found'));
    await team.destroy();
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting team:', error);
    return next(error);
  }
};

module.exports = { listTeams, getTeam, createTeam, updateTeam, deleteTeam };
