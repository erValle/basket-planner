/**
 * @deprecated Use HttpError class instead for better error handling.
 * This module is kept for backward compatibility.
 *
 * @example
 * // Old way (deprecated):
 * const { httpError } = require('./errorHelper');
 * throw httpError(404, 'NOT_FOUND', 'Resource not found');
 *
 * // New way (recommended):
 * const HttpError = require('./HttpError');
 * throw HttpError.notFound('NOT_FOUND', 'Resource not found');
 */

const HttpError = require('./HttpError');

/**
 * @deprecated Use HttpError class methods instead.
 */
const httpError = (status, code, message, details) => {
    return new HttpError(status, code, message, details);
};

module.exports = {
    httpError,
    HttpError,
};