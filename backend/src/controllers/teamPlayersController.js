const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');

const teamPlayersService = require('../services/teamPlayersService');

const listTeamPlayers = async (req, res, next) => {
  try {
    const teamId = Number(req.params.id);
    const rows = await teamPlayersService.listTeamPlayers(teamId, req.query);
    return res.status(StatusCodes.OK).json(rows);
  } catch (error) {
    logger.error(`Error listing team players: ${error?.message || error}`);
    return next(error);
  }
};

const addTeamPlayer = async (req, res, next) => {
  try {
    const teamId = Number(req.params.id);
    const userId = Number(req.body.userId);
    const created = await teamPlayersService.addPlayerToTeam(teamId, userId);
    return res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error(`Error adding team player: ${error?.message || error}`);
    return next(error);
  }
};

const addTeamPlayersBulk = async (req, res, next) => {
  try {
    const teamId = Number(req.params.id);
    const userIds = Array.isArray(req.body.userIds) ? req.body.userIds : [];
    const summary = await teamPlayersService.addPlayersToTeamBulk(teamId, userIds);
    return res.status(StatusCodes.OK).json(summary);
  } catch (error) {
    logger.error(`Error adding team players bulk: ${error?.message || error}`);
    return next(error);
  }
};

const removeTeamPlayer = async (req, res, next) => {
  try {
    const teamId = Number(req.params.id);
    const userId = Number(req.params.userId);
    await teamPlayersService.removePlayerFromTeam(teamId, userId);
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error(`Error removing team player: ${error?.message || error}`);
    return next(error);
  }
};

module.exports = {
  listTeamPlayers,
  addTeamPlayer,
  addTeamPlayersBulk,
  removeTeamPlayer,
};
