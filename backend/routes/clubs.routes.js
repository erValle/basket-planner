const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole, requireScope } = require('../src/middlewares/rbac');
const { createClubSchema, updateClubSchema } = require('../src/validation/clubSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listClubs, getClub, createClub, updateClub, deleteClub } = require('../src/controllers/clubController');

router.use(requireAuth);

// CU.005: Todos pueden listar/ver clubes
router.get('/', listClubs);
router.get('/:id', validate({ params: idParamSchema }), getClub);

// CU.005: Solo admin puede crear clubes
router.post('/', requireAnyRole('admin'), validate({ body: createClubSchema }), createClub);

// CU.006: Admin global, technical_director solo su club
router.put('/:id', requireAnyRole('admin', 'technical_director'), validate({ params: idParamSchema, body: updateClubSchema }), updateClub);

// CU.007: Solo admin puede eliminar clubes
router.delete('/:id', requireAnyRole('admin'), validate({ params: idParamSchema }), deleteClub);

module.exports = router;
