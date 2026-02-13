/**
 * Middleware y utilidad de logging para un registro consistente en la aplicacion.
 * Proporciona logging estructurado con timestamps ISO y diferentes niveles de log.
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};


const formatLog = (level, message, requestId = null) => {
  const timestamp = new Date().toISOString();
  const reqIdPart = requestId ? ` [${requestId}]` : '';
  return `[${timestamp}] [${level}]${reqIdPart} ${message}`;
};

/**
 * Convierte objetos a string de forma segura para logging, manejando referencias circulares.
 */
const safeStringify = (obj) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};

/**
 * Middleware de Express para registrar peticiones HTTP.
 */
const loggerMiddleware = (req, res, next) => {
  const method = req.method;
  const url = req.originalUrl;
  const requestId = req.requestId;
  const startTime = Date.now();

  // Registrar peticion
  console.log(formatLog(LOG_LEVELS.INFO, `${method} ${url}`, requestId));

  // Registrar respuesta al finalizar
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const level =
      status >= 500 ? LOG_LEVELS.ERROR : status >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    console.log(formatLog(level, `${method} ${url} ${status} ${duration}ms`, requestId));
  });

  next();
};

/**
 * Utilidad de logging con metodos para diferentes niveles de log.
 */
loggerMiddleware.error = (message, data = null) => {
  const formatted = data ? `${message} ${safeStringify(data)}` : message;
  console.error(formatLog(LOG_LEVELS.ERROR, formatted));
};

loggerMiddleware.warn = (message, data = null) => {
  const formatted = data ? `${message} ${safeStringify(data)}` : message;
  console.warn(formatLog(LOG_LEVELS.WARN, formatted));
};

loggerMiddleware.info = (message, data = null) => {
  const formatted = data ? `${message} ${safeStringify(data)}` : message;
  console.log(formatLog(LOG_LEVELS.INFO, formatted));
};

loggerMiddleware.debug = (message, data = null) => {
  if (process.env.NODE_ENV !== 'production') {
    const formatted = data ? `${message} ${safeStringify(data)}` : message;
    console.log(formatLog(LOG_LEVELS.DEBUG, formatted));
  }
};

module.exports = loggerMiddleware;
