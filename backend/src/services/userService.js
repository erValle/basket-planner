const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

const { User } = require('../../models');
const { ENCRYPTION_CONST } = require('../../config/constants');
const errorUtils = require('../libs/errorHelper');
const auditLogService = require('./auditLogService');

const listUsers = async ({ email, search, role, status }) => {
  const where = {};

  // Búsqueda genérica en email, firstName y lastName
  const searchTerm = search || email; // Usar 'search' o 'email' (legacy)
  if (searchTerm) {
    where[Op.or] = [
      { email: { [Op.iLike]: `%${searchTerm}%` } },
      { firstName: { [Op.iLike]: `%${searchTerm}%` } },
      { lastName: { [Op.iLike]: `%${searchTerm}%` } }
    ];
  }
  
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

const createUser = async ({ email, name, firstName, lastName, password, role, status }, auditCtx = {}) => {
  if (!password) {
    throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'PASSWORD_REQUIRED', 'Password is required');
  }

  // Parse 'name' into firstName/lastName if not provided separately
  let finalFirstName = firstName;
  let finalLastName = lastName;
  if (name && (!firstName || !lastName)) {
    const nameParts = name.trim().split(/\s+/);
    finalFirstName = finalFirstName || nameParts[0] || '';
    finalLastName = finalLastName || nameParts.slice(1).join(' ') || '';
  }

  try {
    const passwordHash = await bcrypt.hash(password, ENCRYPTION_CONST.SALT_ROUNDS);
    const created = await User.create({ 
      email, 
      firstName: finalFirstName, 
      lastName: finalLastName, 
      passwordHash, 
      role, 
      status 
    });

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

const updateUser = async (id, { email, name, firstName, lastName, password, role, status }, auditCtx = {}) => {
  const user = await getUserById(id);

  const before = { email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, status: user.status };

  // Parse 'name' into firstName/lastName if provided as single field
  let finalFirstName = firstName;
  let finalLastName = lastName;
  if (name && (!firstName && !lastName)) {
    const nameParts = name.trim().split(/\s+/);
    finalFirstName = nameParts[0] || undefined;
    finalLastName = nameParts.slice(1).join(' ') || undefined;
  }

  const updates = {};
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;
  if (status !== undefined) updates.status = status;
  if (finalFirstName !== undefined) updates.firstName = finalFirstName;
  if (finalLastName !== undefined) updates.lastName = finalLastName;
  if (password) {
    updates.passwordHash = await bcrypt.hash(password, ENCRYPTION_CONST.SALT_ROUNDS);
  }

  try {
    await user.update(updates);

    const after = { email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, status: user.status };
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

const assignUsersToClub = async (userIds, clubId, auditCtx = {}) => {
  const { UserClub, Club } = require('../../models');
  
  // Validate club exists
  const club = await Club.findByPk(clubId);
  if (!club) {
    throw errorUtils.httpError(StatusCodes.NOT_FOUND, 'CLUB_NOT_FOUND', 'Club not found');
  }

  // Validate all users exist and have role 'user'
  const users = await User.findAll({
    where: {
      id: userIds,
      role: 'user'
    }
  });

  if (users.length !== userIds.length) {
    throw errorUtils.httpError(
      StatusCodes.BAD_REQUEST, 
      'INVALID_USERS', 
      'Some users not found or do not have role "user"'
    );
  }

  // Assign users to club and change their role to 'player'
  for (const user of users) {
    // Check if user is already assigned to this club
    const existingAssignment = await UserClub.findOne({
      where: { userId: user.id, clubId }
    });

    if (!existingAssignment) {
      await UserClub.create({ userId: user.id, clubId });
    }

    // Change role to 'player'
    const before = { role: user.role };
    await user.update({ role: 'player' });
    const after = { role: user.role };

    await auditLogService.createAuditLog({
      user: auditCtx.user,
      requestId: auditCtx.requestId,
      action: 'user.assigned_to_club_as_player',
      entity: 'User',
      entityId: user.id,
      metadata: { before, after, clubId },
    });
  }

  return { ok: true };
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignUsersToClub,
};
