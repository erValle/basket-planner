const { createAuditLog } = require('../services/auditLogService');

/**
 * Registra logs de auditoria por peticion (entity=HttpRequest) con latencia y estado.
 * Seguro en modo test/contrato: createAuditLog() no hace nada si la BD no esta inicializada.
 */
const auditRequestMiddleware = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    try {
      const finishedAt = process.hrtime.bigint();
      const latencyMs = Number(finishedAt - startedAt) / 1_000_000;
      const statusCode = res.statusCode;
      const isError = statusCode >= 500;

      // Dispara y olvida para no extender el ciclo de vida de la peticion (y evitar
      // "Cannot log after tests are done" de Jest cuando el proceso se cierra).
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
      // Nunca interrumpir la peticion por errores de monitorizacion.
    }
  });

  next();
};

module.exports = {
  auditRequestMiddleware,
};
