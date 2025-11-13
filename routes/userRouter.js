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

router.get('/', validate({ query: userQuerySchema }), getAllUsers);
router.get('/:id', validate({ params: idParamSchema }), getUserById);
router.post('/', validate({ body: createUserSchema }), createUser);
router.put('/:id', validate({ params: idParamSchema, body: updateUserSchema }), updateUser);
router.delete('/:id', validate({ params: idParamSchema }), deleteUser);

module.exports = router;
