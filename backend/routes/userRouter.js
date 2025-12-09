const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../src/controllers/userController');
const validate = require('../src/middlewares/validate');
const { userQuerySchema, createUserSchema, updateUserSchema } = require('../src/validation/userSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { authorizeRoles, authorizeSelfOrRoles } = require('../src/middlewares/auth');

// List users: admin or technical_director
router.get('/', authorizeRoles('admin','technical_director'), validate({ query: userQuerySchema }), getAllUsers);
// Get single user: admin/technical_director or self
router.get('/:id', authorizeSelfOrRoles('id','admin','technical_director'), validate({ params: idParamSchema }), getUserById);
// Create user: admin only
router.post('/', authorizeRoles('admin'), validate({ body: createUserSchema }), createUser);
// Update user: admin or self
router.put('/:id', authorizeSelfOrRoles('id','admin'), validate({ params: idParamSchema, body: updateUserSchema }), updateUser);
// Delete user: admin only (hard delete handled in controller)
router.delete('/:id', authorizeRoles('admin'), validate({ params: idParamSchema }), deleteUser);

module.exports = router;
