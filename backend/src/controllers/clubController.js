const { StatusCodes } = require('http-status-codes');
const { Club } = require('../../models');
const logger = require('../middlewares/logger');
const errorUtils = require('../libs/errorHelper');

const listClubs = async (req, res, next) => {
  try {
    const { name } = req.query;
    const where = {};
    if (name) where.name = name;
    const clubs = await Club.findAll({ where });
    res.status(StatusCodes.OK).json(clubs);
  } catch (error) {
    logger.error('Error fetching clubs:', error);
    return next(error);
  }
};

const getClub = async (req, res, next) => {
  try {
    const club = await Club.findByPk(req.params.id);
    if (!club) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'CLUB_NOT_FOUND', 'Club not found'));
    res.status(StatusCodes.OK).json(club);
  } catch (error) {
    logger.error('Error fetching club:', error);
    return next(error);
  }
};

const createClub = async (req, res, next) => {
  try {
    const club = await Club.create(req.body);
    res.status(StatusCodes.CREATED).json(club);
  } catch (error) {
    logger.error('Error creating club:', error);
    return next(error);
  }
};

const updateClub = async (req, res, next) => {
  try {
    const club = await Club.findByPk(req.params.id);
    if (!club) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'CLUB_NOT_FOUND', 'Club not found'));
    await club.update(req.body);
    res.status(StatusCodes.OK).json(club);
  } catch (error) {
    logger.error('Error updating club:', error);
    return next(error);
  }
};

const deleteClub = async (req, res, next) => {
  try {
    const club = await Club.findByPk(req.params.id);
    if (!club) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'CLUB_NOT_FOUND', 'Club not found'));
    await club.destroy();
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting club:', error);
    return next(error);
  }
};

module.exports = { listClubs, getClub, createClub, updateClub, deleteClub };
