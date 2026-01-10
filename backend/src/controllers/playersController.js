const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const playersService = require('../services/playersService');
const userClubService = require('../services/userClubService');

const listPlayers = async (req, res, next) => {
  try {
    const rows = await playersService.listPlayers(req.query);
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
