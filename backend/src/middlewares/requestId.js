const { randomUUID } = require('crypto');

const REQUEST_ID_HEADER = 'x-request-id';

const requestIdMiddleware = (req, res, next) => {
  const incoming = req.get(REQUEST_ID_HEADER);
  const requestId = incoming || randomUUID();

  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  next();
};

module.exports = {
  REQUEST_ID_HEADER,
  requestIdMiddleware,
};
