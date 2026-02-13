const { StatusCodes, getReasonPhrase } = require('http-status-codes');


class HttpError extends Error {

  constructor(status, code, message, details = null) {
    super(message || code);

    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;

    // Mantiene el stack trace correcto desde donde se lanzo el error (solo disponible en V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HttpError);
    }
  }

  /**
   * Serializa el error a un objeto compatible con JSON para respuestas API.
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

  // Metodos factory para errores HTTP comunes

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
   * Crea un HttpError a partir de un codigo de estado con mensaje por defecto.
   */
  static fromStatus(status, code, message) {
    return new HttpError(
      status,
      code || getReasonPhrase(status).replace(/\s+/g, '_').toUpperCase(),
      message || getReasonPhrase(status)
    );
  }
}

module.exports = HttpError;
