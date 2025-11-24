const { StatusCodes } = require('http-status-codes');

const validation = (schemas) => {
  return (req, res, next) => {
    const errors = [];
    ['body', 'params', 'query'].forEach(target => {
      if (schemas[target]) {
        if (target === 'body' && req.body && typeof req.body.salary === 'string' && req.body.salary) {
          req.body.salary = Number(req.body.salary);
        }
        const { error, value } = schemas[target].validate(req[target], { abortEarly: false, convert: true });
        if (error) {
          errors.push(...error.details.map(d => ({
            target,
            message: d.message,
            path: d.path.join('.')
          })));
        } else {
          req[target] = value;
        }
      }
    });

    if (errors.length > 0) {
      const err = new Error('Validation error');
      err.status = StatusCodes.BAD_REQUEST;
      err.details = errors;
      return next(err);
    }
    next();
  };
};

module.exports = validation;
