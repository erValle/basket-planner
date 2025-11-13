

const { User } = require('../../models');
const { ENCRYPTION_CONST } = require('../../config/constants');
const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const logger = require('../middlewares/logger');
const errorUtils = require('../libs/errorHelper');


const getAllUsers = async (req, res, next) => {
    try {
        const { email, role, status } = req.query;
        const where = {};
        
        if (email) {
            where.email = { [Op.iLike]: `%${email}%` };
        }
        if(role) {
            where.role = role;
        }
        if(status) {
            where.status = status;
        }

        const users = await User.findAll({ where });
        res.status(StatusCodes.OK).json(users);
    } catch (error) {
        logger.error('Error fetching users:', error);
        return next(error);
    }
};

const getUserById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'USER_NOT_FOUND', 'User not found'));
        }
        res.status(StatusCodes.OK).json(user);
    } catch (error) {
        logger.error('Error fetching user:', error);
        return next(error);
    }
};

const createUser = async (req, res, next) => {
    const { email, name, password, role, status } = req.body;
    if (!password) {
        return next(errorUtils.httpError(StatusCodes.BAD_REQUEST, 'PASSWORD_REQUIRED', 'Password is required'));
    }
    try {
        const passwordHash = await bcrypt.hash(password, ENCRYPTION_CONST.SALT_ROUNDS);
        const newUser = await User.create({ email, name, passwordHash, role, status });
        res.status(StatusCodes.CREATED).json(newUser);
    } catch (error) {
        logger.error('Error creating user:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return next(errorUtils.httpError(StatusCodes.CONFLICT, 'EMAIL_ALREADY_EXISTS', 'Email already exists'));
        }
        if(error.name === 'SequelizeValidationError'){
            const messages = error.errors.map(err => err.message);
            return next(errorUtils.httpError(StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR', messages.join(', ')));
        }
        return next(error);
    }
};

const updateUser = async (req, res, next) => {
    const { id } = req.params;
    const { email, name, password, role, status } = req.body;
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'USER_NOT_FOUND', 'User not found'));
        }
        const updates = { email, name, role, status };
        if (password) {
            updates.passwordHash = await bcrypt.hash(password, ENCRYPTION_CONSTSALT_ROUNDS);
        }
        await user.update(updates);
        res.status(StatusCodes.OK).json(user);
    } catch (error) {
        logger.error('Error updating user:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return next(errorUtils.httpError(StatusCodes.CONFLICT, 'EMAIL_ALREADY_EXISTS', 'Email already exists'));
        }
        if(error.name === 'SequelizeValidationError'){
            const messages = error.errors.map(err => err.message);
            return next(errorUtils.httpError(StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR', messages.join(', ')));
        }
        return next(error);
    }
};

const deleteUser = async (req, res, next) => {
    const { id } = req.params;
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return next(errorUtils.httpError(StatusCodes.NOT_FOUND, 'USER_NOT_FOUND', 'User not found'));
        }
        await user.destroy();
        res.status(StatusCodes.NO_CONTENT).send();
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
