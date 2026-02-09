const express = require('express');
const router = express.Router();

const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { auditLogListQuerySchema } = require('../src/validation/auditLogSchemas');
const {
  listAuditLogs,
  getAuditLog,
  deleteAllAuditLogs,
  exportAuditLogsCsv,
} = require('../src/controllers/auditLogController');

router.use(requireAuth);

// ==================== /audit-logs ====================
// GET    /audit-logs - Listar registros de auditoría - admin
router.get(
  '/',
  requireAnyRole('admin'),
  validate({ query: auditLogListQuerySchema }),
  listAuditLogs
);
// DELETE /audit-logs - Eliminar todos los registros - admin
router.delete('/', requireAnyRole('admin'), deleteAllAuditLogs);

// ==================== /audit-logs/export.csv ====================
// GET /audit-logs/export.csv - Exportar auditoría a CSV - admin
router.get('/export.csv', requireAnyRole('admin'), exportAuditLogsCsv);

// ==================== /audit-logs/:id ====================
// GET /audit-logs/:id - Ver registro por ID - admin
router.get('/:id', requireAnyRole('admin'), getAuditLog);

module.exports = router;
