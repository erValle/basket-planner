const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  assignUsersToClub,
} = require('../src/controllers/userController');
const validate = require('../src/middlewares/validate');
const {
  userQuerySchema,
  createUserSchema,
  updateUserSchema,
  assignUsersToClubSchema,
} = require('../src/validation/userSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { requireAnyRole, requireSelfOrRoles } = require('../src/middlewares/rbac');

// GET  /users - Listado de usuarios - admin y technical_director (para añadir jugadores)
router.get(
  '/',
  requireAnyRole('admin', 'technical_director'),
  validate({ query: userQuerySchema }),
  getAllUsers
);
// POST /users - Registro de usuarios - solo admin
router.post('/', requireAnyRole('admin'), validate({ body: createUserSchema }), createUser);

// POST /users/assign-to-club - Asignar usuarios a club - admin y technical_director
router.post(
  '/assign-to-club',
  requireAnyRole('admin', 'technical_director'),
  validate({ body: assignUsersToClubSchema }),
  assignUsersToClub
);

// GET    /users/:id - Ver usuario - admin o propio
router.get(
  '/:id',
  requireSelfOrRoles('id', 'admin'),
  validate({ params: idParamSchema }),
  getUserById
);
// PUT    /users/:id - Edición de usuarios - admin o propio (solo ciertos campos)
router.put(
  '/:id',
  requireSelfOrRoles('id', 'admin'),
  validate({ params: idParamSchema, body: updateUserSchema }),
  updateUser
);
// DELETE /users/:id - Eliminación de usuarios - solo admin
router.delete('/:id', requireAnyRole('admin'), validate({ params: idParamSchema }), deleteUser);

module.exports = router;
