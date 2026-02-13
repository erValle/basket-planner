const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole, requireScope } = require('../src/middlewares/rbac');
const { createClubSchema, updateClubSchema } = require('../src/validation/clubSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const {
  listClubs,
  getClub,
  createClub,
  updateClub,
  deleteClub,
} = require('../src/controllers/clubController');

router.use(requireAuth);

// GET  /clubs - Todos autenticados pueden listar clubes
router.get('/', listClubs);
// POST /clubs - Solo admin puede crear clubes
router.post('/', requireAnyRole('admin'), validate({ body: createClubSchema }), createClub);

// GET    /clubs/:id - Ver club (todos autenticados)
router.get('/:id', validate({ params: idParamSchema }), getClub);
// PUT    /clubs/:id - Solo admin puede editar clubes
router.put(
  '/:id',
  requireAnyRole('admin'),
  validate({ params: idParamSchema, body: updateClubSchema }),
  updateClub
);
// DELETE /clubs/:id - Solo admin puede eliminar clubes
router.delete('/:id', requireAnyRole('admin'), validate({ params: idParamSchema }), deleteClub);

module.exports = router;
