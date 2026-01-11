const { StatusCodes, getReasonPhrase } = require('http-status-codes');

/**
 * Custom HTTP Error class for consistent error handling across the application.
 * Extends the native Error class to include HTTP-specific properties.
 *
 * @example
 * throw new HttpError(StatusCodes.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
 *
 * @example
 * throw HttpError.notFound('USER_NOT_FOUND', 'User not found');
 */
class HttpError extends Error {
  /**
   * @param {number} status - HTTP status code
   * @param {string} code - Application-specific error code (e.g., 'USER_NOT_FOUND')
   * @param {string} [message] - Human-readable error message
   * @param {Array|Object} [details] - Additional error details (validation errors, etc.)
   */
  constructor(status, code, message, details = null) {
    super(message || code);

    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }
  }

  /**
   * Serializes the error to a JSON-friendly object for API responses.
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }

  // Factory methods for common HTTP errors

  static badRequest(code, message, details) {
    return new HttpError(StatusCodes.BAD_REQUEST, code, message, details);
  }

  static unauthorized(code = 'UNAUTHORIZED', message = 'Authentication required') {
    return new HttpError(StatusCodes.UNAUTHORIZED, code, message);
  }

  static forbidden(code = 'FORBIDDEN', message = 'Access denied') {
    return new HttpError(StatusCodes.FORBIDDEN, code, message);
  }

  static notFound(code, message) {
    return new HttpError(StatusCodes.NOT_FOUND, code, message);
  }

  static conflict(code, message, details) {
    return new HttpError(StatusCodes.CONFLICT, code, message, details);
  }

  static unprocessableEntity(code, message, details) {
    return new HttpError(StatusCodes.UNPROCESSABLE_ENTITY, code, message, details);
  }

  static internal(code = 'INTERNAL_ERROR', message = 'An unexpected error occurred') {
    return new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, code, message);
  }

  /**
   * Creates an HttpError from a status code with default message.
   */
  static fromStatus(status, code, message) {
    return new HttpError(
      status,
      code || getReasonPhrase(status).replace(/\s+/g, '_').toUpperCase(),
      message || getReasonPhrase(status),
    );
  }
}

module.exports = HttpError;
