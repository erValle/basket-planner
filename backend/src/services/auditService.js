/**
 * Audit Service Wrapper
 * Provides simplified audit logging for RBAC middleware
 */

const auditLogService = require('./auditLogService');

/**
 * Log an audit entry
 * @param {Object} params
 * @param {number} params.userId - User ID performing the action
 * @param {string} params.action - Action performed (e.g., 'UNAUTHORIZED_ACCESS_ATTEMPT')
 * @param {string} params.entityType - Type of entity (e.g., 'ENDPOINT', 'PERMISSION')
 * @param {string} params.entityId - Entity identifier
 * @param {Object} params.metadata - Additional metadata
 * @param {string} params.status - Status of the action (e.g., 'DENIED', 'ALLOWED')
 * @returns {Promise<void>}
 */
async function logAudit({ userId, action, entityType, entityId, metadata, status }) {
  try {
    await auditLogService.createAuditLog({
      user: { id: userId },
      action,
      entity: entityType,
      entityId,
      requestId: null, // Can be enhanced with request tracking middleware
      metadata: {
        ...metadata,
        status,
      },
    });
  } catch (error) {
    // Don't throw - audit logging failures shouldn't break the application
    console.error('Audit logging failed:', error);
  }
}

module.exports = {
  logAudit,
};
