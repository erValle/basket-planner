const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const userService = require('../services/userService');


const getAllUsers = async (req, res, next) => {
    try {
        const users = await userService.listUsers(req.query);
        return res.status(StatusCodes.OK).json(users);
    } catch (error) {
        logger.error('Error fetching users:', error);
        return next(error);
    }
};

const getUserById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const user = await userService.getUserById(id);
        return res.status(StatusCodes.OK).json(user);
    } catch (error) {
        logger.error('Error fetching user:', error);
        return next(error);
    }
};

const createUser = async (req, res, next) => {
    try {
        const newUser = await userService.createUser(req.body, { user: req.user, requestId: req.requestId });
        return res.status(StatusCodes.CREATED).json(newUser);
    } catch (error) {
        logger.error('Error creating user:', error);
        return next(error);
    }
};

const updateUser = async (req, res, next) => {
    const { id } = req.params;
    try {
        const user = await userService.updateUser(id, req.body, { user: req.user, requestId: req.requestId });
        return res.status(StatusCodes.OK).json(user);
    } catch (error) {
        logger.error('Error updating user:', error);
        return next(error);
    }
};

const deleteUser = async (req, res, next) => {
    const { id } = req.params;
    try {
        await userService.deleteUser(id);
        return res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
        logger.error('Error deleting user:', error);
        return next(error);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};
