const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const logger = require('./logger');

const errorHandler = (err, req, res, next) => {
    const status = err.status || StatusCodes.INTERNAL_SERVER_ERROR;

    const message = process.env.NODE_ENV === 'production' ? getReasonPhrase(status) : err.message || 'Unexpected Error';
    
    // Build a user-friendly message for validation errors
    let userMessage = message;
    if (err.details && Array.isArray(err.details)) {
        const errorMessages = err.details.map(d => {
            // Clean up Joi error messages
            let msg = d.message.replace(/"/g, '').trim();
            return `${d.path}: ${msg}`;
        }).join('\n');
        userMessage = `Validation failed:\n${errorMessages}`;
    }
    
    const response = {
        error: {
            code: err.code || getReasonPhrase(status).replace(/\s+/g, '_').toUpperCase(),
            message: userMessage,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
            ...(err.details && { details: err.details })
        }
    };
    res.status(status).json(response);
};

module.exports = {
    errorHandler,
};