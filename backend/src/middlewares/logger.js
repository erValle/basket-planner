/**
 * Logger middleware and utility for consistent logging across the application.
 * Provides structured logging with ISO timestamps and different log levels.
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

/**
 * Formats a log message with timestamp, level, and optional request ID.
 * @param {string} level - Log level (ERROR, WARN, INFO, DEBUG)
 * @param {string} message - Log message
 * @param {string} [requestId] - Optional request ID for tracing
 * @returns {string} Formatted log string
 */
const formatLog = (level, message, requestId = null) => {
  const timestamp = new Date().toISOString();
  const reqIdPart = requestId ? ` [${requestId}]` : '';
  return `[${timestamp}] [${level}]${reqIdPart} ${message}`;
};

/**
 * Safely stringifies objects for logging, handling circular references.
 */
const safeStringify = (obj) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};

/**
 * Express middleware for logging HTTP requests.
 */
const loggerMiddleware = (req, res, next) => {
  const method = req.method;
  const url = req.originalUrl;
  const requestId = req.requestId;
  const startTime = Date.now();

  // Log request
  console.log(formatLog(LOG_LEVELS.INFO, `${method} ${url}`, requestId));

  // Log response on finish
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
 * Logger utility object with methods for different log levels.
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
