

const HttpError = require('./HttpError');


const httpError = (status, code, message, details) => {
  return new HttpError(status, code, message, details);
};

module.exports = {
  httpError,
  HttpError,
};
