/**
 * Async handler wrapper for Express route handlers.
 * Eliminates the need for try-catch blocks in every async controller.
 *
 * @example
 * // Before (verbose):
 * const getUser = async (req, res, next) => {
 *   try {
 *     const user = await userService.findById(req.params.id);
 *     res.json(user);
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 *
 * // After (clean):
 * const getUser = asyncHandler(async (req, res) => {
 *   const user = await userService.findById(req.params.id);
 *   res.json(user);
 * });
 *
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function with error handling
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Wraps an object of controller methods with asyncHandler.
 * Useful for wrapping all methods in a controller at once.
 *
 * @example
 * const userController = wrapController({
 *   getUser: async (req, res) => { ... },
 *   createUser: async (req, res) => { ... },
 * });
 *
 * @param {Object} controller - Object with async methods
 * @returns {Object} Object with wrapped methods
 */
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
