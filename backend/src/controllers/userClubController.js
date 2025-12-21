const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const userClubService = require('../services/userClubService');

const listUserClubs = async (req, res, next) => {
  try {
    const memberships = await userClubService.listUserClubs(req.query);
    return res.status(StatusCodes.OK).json(memberships);
  } catch (error) {
    logger.error('Error fetching memberships:', error);
    return next(error);
  }
};

const getUserClub = async (req, res, next) => {
  try {
    const uc = await userClubService.getUserClubById(req.params.id);
    return res.status(StatusCodes.OK).json(uc);
  } catch (error) {
    logger.error('Error fetching membership:', error);
    return next(error);
  }
};

const createUserClub = async (req, res, next) => {
  try {
    const created = await userClubService.createUserClub(req.body);
    return res.status(StatusCodes.CREATED).json(created);
  } catch (error) {
    logger.error('Error creating membership:', error);
    return next(error);
  }
};

const updateUserClub = async (req, res, next) => {
  try {
    const uc = await userClubService.updateUserClub(req.params.id, req.body);
    return res.status(StatusCodes.OK).json(uc);
  } catch (error) {
    logger.error('Error updating membership:', error);
    return next(error);
  }
};

const deleteUserClub = async (req, res, next) => {
  try {
    await userClubService.deleteUserClub(req.params.id);
    return res.status(StatusCodes.NO_CONTENT).send();
  } catch (error) {
    logger.error('Error deleting membership:', error);
    return next(error);
  }
};

module.exports = { listUserClubs, getUserClub, createUserClub, updateUserClub, deleteUserClub };
