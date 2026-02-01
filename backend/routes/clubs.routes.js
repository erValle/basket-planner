const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole, requireScope } = require('../src/middlewares/rbac');
const { createClubSchema, updateClubSchema } = require('../src/validation/clubSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listClubs, getClub, createClub, updateClub, deleteClub } = require('../src/controllers/clubController');

router.use(requireAuth);

// ==================== /clubs ====================
// GET  /clubs - CU.005: Todos pueden listar clubes
router.get('/', listClubs);
// POST /clubs - CU.005: Solo admin puede crear clubes
router.post('/', requireAnyRole('admin'), validate({ body: createClubSchema }), createClub);

// ==================== /clubs/:id ====================
// GET    /clubs/:id - CU.005: Ver club
router.get('/:id', validate({ params: idParamSchema }), getClub);
// PUT    /clubs/:id - CU.006: Admin global, technical_director solo su club
router.put('/:id', requireAnyRole('admin', 'technical_director'), validate({ params: idParamSchema, body: updateClubSchema }), updateClub);
// DELETE /clubs/:id - CU.007: Solo admin puede eliminar clubes
router.delete('/:id', requireAnyRole('admin'), validate({ params: idParamSchema }), deleteClub);

module.exports = router;
