const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { createUserClubSchema, updateUserClubSchema } = require('../src/validation/userClubSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listUserClubs, getUserClub, createUserClub, updateUserClub, deleteUserClub } = require('../src/controllers/userClubController');

router.use(requireAuth);

router.get('/', listUserClubs);
router.get('/:id', validate({ params: idParamSchema }), getUserClub);
router.post('/', requireAnyRole('admin', 'technical_director'), validate({ body: createUserClubSchema }), createUserClub);
router.put('/:id', requireAnyRole('admin', 'technical_director'), validate({ params: idParamSchema, body: updateUserClubSchema }), updateUserClub);
router.delete('/:id', requireAnyRole('admin', 'technical_director'), validate({ params: idParamSchema }), deleteUserClub);

module.exports = router;
