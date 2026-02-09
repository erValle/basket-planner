const { StatusCodes } = require('http-status-codes');

const auditLogService = require('../services/auditLogService');

const listAuditLogs = async (req, res, next) => {
  try {
    const result = await auditLogService.listAuditLogsPaged(req.query);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    return next(error);
  }
};

const getAuditLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await auditLogService.getAuditLogById(id);

    if (!item) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: 'NOT_FOUND',
        message: 'Audit log not found',
      });
    }

    return res.status(StatusCodes.OK).json({ item });
  } catch (error) {
    return next(error);
  }
};

const deleteAllAuditLogs = async (req, res, next) => {
  try {
    const result = await auditLogService.deleteAllAuditLogs();
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    return next(error);
  }
};

const exportAuditLogsCsv = async (req, res, next) => {
  try {
    const csv = await auditLogService.exportAuditLogsAsCsv(req.query);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    return res.status(StatusCodes.OK).send(csv);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listAuditLogs,
  getAuditLog,
  deleteAllAuditLogs,
  exportAuditLogsCsv,
};
