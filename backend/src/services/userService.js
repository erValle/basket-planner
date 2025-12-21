const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

const { User } = require('../../models');
const { ENCRYPTION_CONST } = require('../../config/constants');
const errorUtils = require('../libs/errorHelper');

const listUsers = async ({ email, role, status }) => {
  const where = {};

  if (email) where.email = { [Op.iLike]: `%${email}%` };
  if (role) where.role = role;
  if (status) where.status = status;

  return User.findAll({ where });
};

const getUserById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
  }
  return user;
};

const createUser = async ({ email, name, password, role, status }) => {
  if (!password) {
    throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'PASSWORD_REQUIRED', 'Password is required');
  }

  try {
    const passwordHash = await bcrypt.hash(password, ENCRYPTION_CONST.SALT_ROUNDS);
    return await User.create({ email, name, passwordHash, role, status });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw errorUtils.httpError(StatusCodes.CONFLICT, 'EMAIL_ALREADY_EXISTS', 'Email already exists');
    }
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR', messages.join(', '));
    }
    throw error;
  }
};

const updateUser = async (id, { email, name, password, role, status }) => {
  const user = await getUserById(id);

  const updates = { email, name, role, status };
  if (password) {
    updates.passwordHash = await bcrypt.hash(password, ENCRYPTION_CONST.SALT_ROUNDS);
  }

  try {
    await user.update(updates);
    return user;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw errorUtils.httpError(StatusCodes.CONFLICT, 'EMAIL_ALREADY_EXISTS', 'Email already exists');
    }
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR', messages.join(', '));
    }
    throw error;
  }
};

const deleteUser = async (id) => {
  const user = await getUserById(id);
  await user.destroy();
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
