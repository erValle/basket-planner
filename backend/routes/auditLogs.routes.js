const express = require('express');
const router = express.Router();

const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { auditLogListQuerySchema } = require('../src/validation/auditLogSchemas');
const { listAuditLogs, getAuditLog } = require('../src/controllers/auditLogController');

router.use(requireAuth);

// Admin-only audit log access
router.get('/', requireAnyRole('admin'), validate({ query: auditLogListQuerySchema }), listAuditLogs);
router.get('/:id', requireAnyRole('admin'), getAuditLog);

module.exports = router;
