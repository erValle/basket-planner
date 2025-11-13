const { StatusCodes, getReasonPhrase } = require('http-status-codes');
const logger = require('./logger');

const errorHandler = (err, req, res, next) => {
    const status = err.status || StatusCodes.INTERNAL_SERVER_ERROR;

    const message = process.env.NODE_ENV === 'production' ? getReasonPhrase(status) : err.message || 'Unexpected Error';
    
    const response = {
        error: {
            code: err.code || getReasonPhrase(status).replace(/\s+/g, '_').toUpperCase(),
            message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
            ...(err.details && { details: err.details })
        }
    };
    res.status(status).json(response);
};

module.exports = {
    errorHandler,
};