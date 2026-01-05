const express = require('express');
const router = express.Router();

const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const { auditLogListQuerySchema } = require('../src/validation/auditLogSchemas');
const { listAuditLogs } = require('../src/controllers/auditLogController');

router.use(authenticateToken);

// Admin-only audit log access
router.get('/', authorizeRoles('admin'), validate({ query: auditLogListQuerySchema }), listAuditLogs);

module.exports = router;
