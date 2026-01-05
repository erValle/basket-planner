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

module.exports = {
  listAuditLogs,
};
