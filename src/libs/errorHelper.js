

const httpError = (status, code, message, details) => {
    const error = new Error(message || code);
    error.status = status;
    error.code = code;
    if (details) {
        error.details = details;
    }
    return error;
};

module.exports = {
    httpError
};