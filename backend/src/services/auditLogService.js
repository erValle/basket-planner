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

  const limit = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * limit;

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  const totalPages = Math.ceil(count / limit);
  return {
    items: rows,
    page: Math.max(parseInt(page, 10) || 1, 1),
    pageSize: limit,
    total: count,
    totalPages,
  };
};

module.exports = {
  createAuditLog,
  listAuditLogsPaged,
};
