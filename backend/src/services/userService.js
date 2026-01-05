const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

const { User } = require('../../models');
const { ENCRYPTION_CONST } = require('../../config/constants');
const errorUtils = require('../libs/errorHelper');
const auditLogService = require('./auditLogService');

const listUsers = async ({ email, role, status }) => {
  const where = {};

  if (email) where.email = { [Op.iLike]: `%${email}%` };
  if (role === 'none') where.role = { [Op.is]: null };
  else if (role) where.role = role;
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

const createUser = async ({ email, name, password, role, status }, auditCtx = {}) => {
  if (!password) {
    throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'PASSWORD_REQUIRED', 'Password is required');
  }

  try {
    const passwordHash = await bcrypt.hash(password, ENCRYPTION_CONST.SALT_ROUNDS);
    const created = await User.create({ email, name, passwordHash, role, status });

    await auditLogService.createAuditLog({
      user: auditCtx.user,
      requestId: auditCtx.requestId,
      action: 'user.created',
      entity: 'User',
      entityId: created.id,
      metadata: { createdEmail: created.email, role: created.role, status: created.status },
    });

    return created;
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

const updateUser = async (id, { email, name, password, role, status }, auditCtx = {}) => {
  const user = await getUserById(id);

  const before = { email: user.email, name: user.name, role: user.role, status: user.status };

  const updates = { email, name, role, status };
  if (password) {
    updates.passwordHash = await bcrypt.hash(password, ENCRYPTION_CONST.SALT_ROUNDS);
  }

  try {
    await user.update(updates);

    const after = { email: user.email, name: user.name, role: user.role, status: user.status };
    const roleChanged = before.role !== after.role;

    await auditLogService.createAuditLog({
      user: auditCtx.user,
      requestId: auditCtx.requestId,
      action: roleChanged ? 'user.role_updated' : 'user.updated',
      entity: 'User',
      entityId: user.id,
      metadata: { before, after },
    });

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
