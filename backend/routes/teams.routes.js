const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const { createTeamSchema, updateTeamSchema } = require('../src/validation/teamSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listTeams, getTeam, createTeam, updateTeam, deleteTeam } = require('../src/controllers/teamController');

router.use(authenticateToken);

router.get('/', listTeams);
router.get('/:id', validate({ params: idParamSchema }), getTeam);
router.post('/', authorizeRoles('admin','technical_director'), validate({ body: createTeamSchema }), createTeam);
router.put('/:id', authorizeRoles('admin','technical_director'), validate({ params: idParamSchema, body: updateTeamSchema }), updateTeam);
router.delete('/:id', authorizeRoles('admin','technical_director'), validate({ params: idParamSchema }), deleteTeam);

module.exports = router;
