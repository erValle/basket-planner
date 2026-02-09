const { createAuditLog } = require('../services/auditLogService');

/**
 * Writes per-request audit logs (entity=HttpRequest) with latency and status.
 * Safe in contract/test mode: createAuditLog() no-ops if DB isn't initialized.
 */
const auditRequestMiddleware = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    try {
      const finishedAt = process.hrtime.bigint();
      const latencyMs = Number(finishedAt - startedAt) / 1_000_000;
      const statusCode = res.statusCode;
      const isError = statusCode >= 500;

      // Fire-and-forget to avoid extending request lifecycle (and causing Jest
      // "Cannot log after tests are done" when the process shuts down).
      Promise.resolve(
        createAuditLog({
          user: req.user,
          action: isError ? 'http_request.error' : 'http_request.success',
          entity: 'HttpRequest',
          entityId: null,
          requestId: req.requestId,
          metadata: {
            method: req.method,
            path: req.originalUrl,
            statusCode,
            latencyMs: Math.round(latencyMs),
          },
        })
      ).catch(() => {});
    } catch {
      // Never break the request path due to monitoring.
    }
  });

  next();
};

module.exports = {
  auditRequestMiddleware,
};
