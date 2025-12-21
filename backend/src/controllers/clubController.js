const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const clubService = require('../services/clubService');

const listClubs = async (req, res, next) => {
  try {
    const clubs = await clubService.listClubs(req.query);
    return res.status(StatusCodes.OK).json(clubs);
  } catch (error) {
    logger.error('Error fetching clubs:', error);
    return next(error);
  }
};

const getClub = async (req, res, next) => {
  try {
    const club = await clubService.getClubById(req.params.id);
    return res.status(StatusCodes.OK).json(club);
  } catch (error) {
    logger.error('Error fetching club:', error);
    return next(error);
  }
};

const createClub = async (req, res, next) => {
  try {
    const club = await clubService.createClub(req.body);
    return res.status(StatusCodes.CREATED).json(club);
  } catch (error) {
    logger.error('Error creating club:', error);
    return next(error);
  }
};

const updateClub = async (req, res, next) => {
  try {
    const club = await clubService.updateClub(req.params.id, req.body);
    return res.status(StatusCodes.OK).json(club);
  } catch (error) {
    logger.error('Error updating club:', error);
    return next(error);
  }
};

const deleteClub = async (req, res, next) => {
  try {
    await clubService.deleteClub(req.params.id);
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting club:', error);
    return next(error);
  }
};

module.exports = { listClubs, getClub, createClub, updateClub, deleteClub };
