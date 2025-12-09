const { StatusCodes } = require('http-status-codes');
const { UserClub } = require('../../models');
const logger = require('../middlewares/logger');
const errorUtils = require('../libs/errorHelper');
const { Op } = require('sequelize');

const listUserClubs = async (req, res, next) => {
  try {
    const { userId, clubId } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (clubId) where.clubId = clubId;
    const memberships = await UserClub.findAll({ where });
    res.status(StatusCodes.OK).json(memberships);
  } catch (error) {
    logger.error('Error fetching memberships:', error);
    return next(error);
  }
};

const getUserClub = async (req, res, next) => {
  try {
    const uc = await UserClub.findByPk(req.params.id);
    if (!uc) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'USER_CLUB_NOT_FOUND', 'Membership not found'));
    res.status(StatusCodes.OK).json(uc);
  } catch (error) {
    logger.error('Error fetching membership:', error);
    return next(error);
  }
};

const createUserClub = async (req, res, next) => {
  try {
    const created = await UserClub.create(req.body);
    res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating membership:', error);
    return next(error);
  }
};

const updateUserClub = async (req, res, next) => {
  try {
    const uc = await UserClub.findByPk(req.params.id);
    if (!uc) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'USER_CLUB_NOT_FOUND', 'Membership not found'));
    await uc.update(req.body);
    res.status(StatusCodes.OK).json(uc);
  } catch (error) {
    logger.error('Error updating membership:', error);
    return next(error);
  }
};

const deleteUserClub = async (req, res, next) => {
  try {
    const uc = await UserClub.findByPk(req.params.id);
    if (!uc) return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'USER_CLUB_NOT_FOUND', 'Membership not found'));
    await uc.destroy();
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting membership:', error);
    return next(error);
  }
};

module.exports = { listUserClubs, getUserClub, createUserClub, updateUserClub, deleteUserClub };
