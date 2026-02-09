const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { createUserClubSchema, updateUserClubSchema } = require('../src/validation/userClubSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const {
  listUserClubs,
  getUserClub,
  createUserClub,
  updateUserClub,
  deleteUserClub,
} = require('../src/controllers/userClubController');

router.use(requireAuth);

// ==================== /user-clubs ====================
// GET  /user-clubs - Listar membresías de club - todos autenticados
router.get('/', listUserClubs);
// POST /user-clubs - Crear membresía - admin, technical_director
router.post(
  '/',
  requireAnyRole('admin', 'technical_director'),
  validate({ body: createUserClubSchema }),
  createUserClub
);

// ==================== /user-clubs/:id ====================
// GET    /user-clubs/:id - Ver membresía
router.get('/:id', validate({ params: idParamSchema }), getUserClub);
// PUT    /user-clubs/:id - Actualizar membresía - admin, technical_director
router.put(
  '/:id',
  requireAnyRole('admin', 'technical_director'),
  validate({ params: idParamSchema, body: updateUserClubSchema }),
  updateUserClub
);
// DELETE /user-clubs/:id - Eliminar membresía - admin, technical_director
router.delete(
  '/:id',
  requireAnyRole('admin', 'technical_director'),
  validate({ params: idParamSchema }),
  deleteUserClub
);

module.exports = router;
