const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');

const { AuditLog } = require('../../models');
const errorUtils = require('../libs/errorHelper');

const safeJson = (value) => {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return { _unserializable: true };
  }
};

/**
 * Contract:
 * - input: { user, action, entity, entityId, requestId, metadata }
 * - never throws for missing DB/model in test contract mode; returns null.
 */
const createAuditLog = async ({ user, action, entity, entityId, requestId, metadata } = {}) => {
  // If AuditLog model isn't available (e.g. NODE_ENV=test without USE_TEST_DB), no-op.
  if (!AuditLog) return null;

  if (!action || !entity) {
    throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'INVALID_AUDIT_LOG', 'action and entity are required');
  }

  const payload = {
    userId: user?.id ?? null,
    action,
    entity,
    entityId: entityId != null ? String(entityId) : null,
    requestId: requestId ?? null,
    metadata: safeJson(metadata),
  };

  return AuditLog.create(payload);
};

const listAuditLogsPaged = async ({
  page = 1,
  pageSize = 20,
  limit, // Alias for pageSize from frontend
  action,
  entity,
  entityId,
  userId,
  requestId,
  from,
  to,
} = {}) => {
  if (!AuditLog) {
    // Contract/test mode without DB
    return { items: [], page, pageSize, total: 0, totalPages: 0 };
  }

  // Need User model for including user info
  const { User } = require('../../models');

  const where = {};

  if (action) where.action = action;
  if (entity) where.entity = entity;
  if (entityId) where.entityId = String(entityId);
  if (userId) where.userId = userId;
  if (requestId) where.requestId = requestId;

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to) where.createdAt[Op.lte] = new Date(to);
  }

  // Use limit as alias for pageSize if provided
  const effectivePageSize = limit ?? pageSize;
  const limitVal = Math.min(Math.max(parseInt(effectivePageSize, 10) || 20, 1), 200);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limitVal;

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: limitVal,
    offset,
    include: User
      ? [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'name', 'firstName', 'lastName'],
          },
        ]
      : [],
  });

  // Transform to match frontend expected format
  const items = rows.map((row) => {
    const json = row.toJSON ? row.toJSON() : row;
    const user = json.user;
    const actorName =
      user?.name ||
      [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
      user?.email ||
      `User ${json.userId ?? 'unknown'}`;

    return {
      id: String(json.id),
      createdAt: json.createdAt,
      action: json.action,
      entity: json.entity,
      entityId: json.entityId ?? '',
      requestId: json.requestId ?? '',
      metadata: json.metadata,
      summary: `${json.action} ${json.entity}${json.entityId ? ` #${json.entityId}` : ''}`,
      actor: {
        id: String(json.userId ?? ''),
        name: actorName,
        email: user?.email ?? '',
      },
    };
  });

  const totalPages = Math.ceil(count / limitVal);
  return {
    items,
    page: Math.max(parseInt(page, 10) || 1, 1),
    pageSize: limitVal,
    total: count,
    totalPages,
  };
};

/**
 * Get a single audit log by ID
 */
const getAuditLogById = async (id) => {
  if (!AuditLog) return null;

  const { User } = require('../../models');

  const row = await AuditLog.findByPk(id, {
    include: User
      ? [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'name', 'firstName', 'lastName'],
          },
        ]
      : [],
  });

  if (!row) return null;

  const json = row.toJSON ? row.toJSON() : row;
  const user = json.user;
  const actorName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    `User ${json.userId ?? 'unknown'}`;

  return {
    id: String(json.id),
    createdAt: json.createdAt,
    action: json.action,
    entity: json.entity,
    entityId: json.entityId ?? '',
    requestId: json.requestId ?? '',
    metadata: json.metadata,
    summary: `${json.action} ${json.entity}${json.entityId ? ` #${json.entityId}` : ''}`,
    actor: {
      id: String(json.userId ?? ''),
      name: actorName,
      email: user?.email ?? '',
    },
  };
};

module.exports = {
  createAuditLog,
  listAuditLogsPaged,
  getAuditLogById,
};
