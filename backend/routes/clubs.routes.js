const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const { createClubSchema, updateClubSchema } = require('../src/validation/clubSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listClubs, getClub, createClub, updateClub, deleteClub } = require('../src/controllers/clubController');

router.use(authenticateToken);

router.get('/', listClubs);
router.get('/:id', validate({ params: idParamSchema }), getClub);
router.post('/', authorizeRoles('admin','technical_director'), validate({ body: createClubSchema }), createClub);
router.put('/:id', authorizeRoles('admin','technical_director'), validate({ params: idParamSchema, body: updateClubSchema }), updateClub);
router.delete('/:id', authorizeRoles('admin'), validate({ params: idParamSchema }), deleteClub);

module.exports = router;
