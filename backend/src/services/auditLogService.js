const { StatusCodes } = require('http-status-codes');
const { Op } = require('sequelize');

const { AuditLog } = require('../../models');
const errorUtils = require('../libs/errorHelper');

/**
 * Whitelist de acciones que se deben registrar en auditoría.
 * Solo se registran acciones de negocio relevantes, no todas las peticiones HTTP.
 * 
 * Categorías:
 * - user.*: Gestión de usuarios (registro, login, actualización, eliminación)
 * - training_plan.*: Gestión de planes de entrenamiento (creación, actualización, generación, eliminación)
 * - training_plan_version.*: Gestión de versiones de planes (creación, publicación)
 * - plan_assignment.*: Asignaciones de planes (asignación, visualización por jugador, actualización, eliminación)
 * - feedback.*: Feedback de entrenamientos (creación, actualización, eliminación)
 * - club.*: Gestión de clubes (creación, actualización, eliminación)
 * - team.*: Gestión de equipos (creación, actualización, eliminación)
 * - exercise.*: Gestión de ejercicios (creación, actualización, eliminación)
 * - equipment.*: Gestión de equipamiento (creación, actualización, eliminación)
 */
const ALLOWED_AUDIT_ACTIONS = new Set([
  // Usuarios
  'user.created',
  'user.login',
  'user.logout',
  'user.updated',
  'user.deleted',
  'user.password_changed',
  'user.role_changed',
  
  // Planes de entrenamiento
  'training_plan.created',
  'training_plan.updated',
  'training_plan.deleted',
  'training_plan.generated',
  'training_plan.duplicated',
  
  // Versiones de planes
  'training_plan_version.created',
  'training_plan_version.published',
  'training_plan_version.activated',
  
  // Asignaciones
  'plan_assignment.created',
  'plan_assignment.viewed_by_player',
  'plan_assignment.updated',
  'plan_assignment.deleted',
  'plan_assignment.status_changed',
  
  // Feedback
  'feedback.created',
  'feedback.updated',
  'feedback.deleted',
  
  // Clubes
  'club.created',
  'club.updated',
  'club.deleted',
  
  // Equipos
  'team.created',
  'team.updated',
  'team.deleted',
  'team.player_added',
  'team.player_removed',
  
  // Ejercicios
  'exercise.created',
  'exercise.updated',
  'exercise.deleted',
  
  // Equipamiento
  'equipment.created',
  'equipment.updated',
  'equipment.deleted',
]);

const safeJson = (value) => {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return { _unserializable: true };
  }
};

/**
 * Crea un registro de auditoría para acciones de negocio relevantes.
 * Solo se registran acciones incluidas en ALLOWED_AUDIT_ACTIONS.
 * 
 * Contract:
 * - input: { user, action, entity, entityId, requestId, metadata }
 * - Si la acción no está en la whitelist, se ignora silenciosamente y retorna null
 * - Nunca lanza error para acciones no permitidas (para no romper flujos existentes)
 * - Retorna null en modo test sin DB
 */
const createAuditLog = async ({ user, action, entity, entityId, requestId, metadata } = {}) => {
  // If AuditLog model isn't available (e.g. NODE_ENV=test without USE_TEST_DB), no-op.
  if (!AuditLog) return null;

  if (!action || !entity) {
    throw errorUtils.httpError(StatusCodes.BAD_REQUEST, 'INVALID_AUDIT_LOG', 'action and entity are required');
  }

  // Filtrar: solo registrar acciones en la whitelist
  if (!ALLOWED_AUDIT_ACTIONS.has(action)) {
    // Ignorar silenciosamente acciones no permitidas (no romper el flujo)
    return null;
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
            attributes: ['id', 'email', 'firstName', 'lastName'],
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
            attributes: ['id', 'email', 'firstName', 'lastName'],
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

/**
 * Delete all audit logs (admin only)
 */
const deleteAllAuditLogs = async () => {
  if (!AuditLog) return { deleted: 0 };
  
  const count = await AuditLog.destroy({
    where: {},
    truncate: true,
  });
  
  return { deleted: count };
};

/**
 * Export audit logs as CSV
 */
const exportAuditLogsAsCsv = async (filters = {}) => {
  if (!AuditLog) return '';

  const { User } = require('../../models');

  const where = {};

  // Apply filters (same as listAuditLogsPaged)
  if (filters.entity) where.entity = filters.entity;
  if (filters.action) where.action = filters.action;
  if (filters.userId) where.userId = filters.userId;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.requestId) where.requestId = { [Op.like]: `%${filters.requestId}%` };
  
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt[Op.gte] = new Date(filters.from);
    if (filters.to) {
      const toDate = new Date(filters.to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt[Op.lte] = toDate;
    }
  }

  const rows = await AuditLog.findAll({
    where,
    include: User
      ? [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'firstName', 'lastName'],
          },
        ]
      : [],
    order: [['createdAt', 'DESC']],
    limit: 10000, // Limit to prevent memory issues
  });

  // Build CSV
  const headers = ['ID', 'Created At', 'User ID', 'User Name', 'User Email', 'Action', 'Entity', 'Entity ID', 'Request ID', 'Summary'];
  const csvRows = [headers.join(',')];

  for (const row of rows) {
    const json = row.toJSON ? row.toJSON() : row;
    const user = json.user;
    const actorName =
      user?.name ||
      [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
      user?.email ||
      `User ${json.userId ?? 'unknown'}`;

    const csvRow = [
      json.id,
      json.createdAt,
      json.userId ?? '',
      actorName.replace(/,/g, ';'), // Escape commas
      user?.email ?? '',
      json.action,
      json.entity,
      json.entityId ?? '',
      json.requestId ?? '',
      `${json.action} ${json.entity}${json.entityId ? ` #${json.entityId}` : ''}`.replace(/,/g, ';'),
    ];

    csvRows.push(csvRow.join(','));
  }

  return csvRows.join('\n');
};

module.exports = {
  createAuditLog,
  listAuditLogsPaged,
  getAuditLogById,
  deleteAllAuditLogs,
  exportAuditLogsAsCsv,
  ALLOWED_AUDIT_ACTIONS, // Exportar para consulta y testing
};
