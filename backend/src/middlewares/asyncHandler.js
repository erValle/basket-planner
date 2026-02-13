
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};


const wrapController = (controller) => {
  const wrapped = {};
  for (const [key, value] of Object.entries(controller)) {
    if (typeof value === 'function') {
      wrapped[key] = asyncHandler(value);
    } else {
      wrapped[key] = value;
    }
  }
  return wrapped;
};

module.exports = {
  asyncHandler,
  wrapController,
};
