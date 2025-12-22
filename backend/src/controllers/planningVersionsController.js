const { StatusCodes } = require('http-status-codes');
const logger = require('../middlewares/logger');
const trainingPlanVersionService = require('../services/trainingPlanVersionService');
const planningExportService = require('../services/planningExportService');

const listVersions = async (req, res, next) => {
  try {
    const result = await trainingPlanVersionService.listVersionsPaged(req.params.id, req.query);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    logger.error('Error listing planning versions:', error);
    return next(error);
  }
};

const exportVersion = async (req, res, next) => {
  try {
    const format = (req.query.format || 'csv').toLowerCase();

    if (!['csv', 'pdf'].includes(format)) {
      const err = new Error('format must be csv or pdf');
      err.status = StatusCodes.BAD_REQUEST;
      throw err;
    }

    const planId = req.params.id;
    const versionId = req.params.versionId;

    const version = await trainingPlanVersionService.getVersion(planId, versionId);

    const filenameBase = `plan-${planId}-v${version.versionNumber}`;

    if (format === 'csv') {
      const csv = planningExportService.exportToCSV(version, {
        title: `Plan ${planId} — v${version.versionNumber}`,
        author: req.user?.id ? `user:${req.user.id}` : '',
        planId,
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
      return res.status(StatusCodes.OK).send(csv);
    }

    const pdfBuffer = await planningExportService.exportToPDF(version, {
      title: `Plan ${planId} — v${version.versionNumber}`,
      author: req.user?.id ? `user:${req.user.id}` : '',
      planId,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);
    return res.status(StatusCodes.OK).send(pdfBuffer);
  } catch (error) {
    logger.error('Error exporting planning version:', error);
    return next(error);
  }
};

module.exports = {
  listVersions,
  exportVersion,
};
