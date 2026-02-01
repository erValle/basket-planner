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
const { userQuerySchema, createUserSchema, updateUserSchema, assignUsersToClubSchema } = require('../src/validation/userSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { requireAnyRole, requireSelfOrRoles } = require('../src/middlewares/rbac');

// ==================== /users ====================
// GET  /users - CU.002: Listado de usuarios - admin, technical_director
router.get('/', requireAnyRole('admin', 'technical_director'), validate({ query: userQuerySchema }), getAllUsers);
// POST /users - CU.002: Registro de usuarios - solo admin
router.post('/', requireAnyRole('admin'), validate({ body: createUserSchema }), createUser);

// ==================== /users/assign-to-club ====================
// POST /users/assign-to-club - Asignar usuarios a club (convertir usuarios en jugadores) - admin, technical_director
router.post('/assign-to-club', requireAnyRole('admin', 'technical_director'), validate({ body: assignUsersToClubSchema }), assignUsersToClub);

// ==================== /users/:id ====================
// GET    /users/:id - CU.003: Ver usuario - admin/technical_director o propio
router.get('/:id', requireSelfOrRoles('id', 'admin', 'technical_director'), validate({ params: idParamSchema }), getUserById);
// PUT    /users/:id - CU.003: Edición de usuarios - admin o propio
router.put('/:id', requireSelfOrRoles('id', 'admin'), validate({ params: idParamSchema, body: updateUserSchema }), updateUser);
// DELETE /users/:id - CU.004: Eliminación de usuarios - solo admin
router.delete('/:id', requireAnyRole('admin'), validate({ params: idParamSchema }), deleteUser);

module.exports = router;
