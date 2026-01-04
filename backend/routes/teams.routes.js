const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const { createTeamSchema, updateTeamSchema } = require('../src/validation/teamSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listTeams, getTeam, createTeam, updateTeam, deleteTeam } = require('../src/controllers/teamController');
const {
	teamIdParamSchema,
	addTeamPlayerSchema,
	addTeamPlayersBulkSchema,
	removeTeamPlayerSchema,
	listTeamPlayersQuerySchema,
} = require('../src/validation/teamPlayersSchemas');
const {
	listTeamPlayers,
	addTeamPlayer,
	addTeamPlayersBulk,
	removeTeamPlayer,
} = require('../src/controllers/teamPlayersController');

router.use(authenticateToken);

router.get('/', listTeams);
router.get('/:id', validate({ params: idParamSchema }), getTeam);

// Players management for teams
router.get(
	'/:id/players',
	authorizeRoles('admin', 'technical_director', 'coach'),
	validate({ params: teamIdParamSchema, query: listTeamPlayersQuerySchema }),
	listTeamPlayers
);
router.post(
	'/:id/players',
	authorizeRoles('admin', 'technical_director', 'coach'),
	validate({ params: teamIdParamSchema, body: addTeamPlayerSchema }),
	addTeamPlayer
);

router.post(
	'/:id/players/bulk',
	authorizeRoles('admin', 'technical_director', 'coach'),
	validate({ params: teamIdParamSchema, body: addTeamPlayersBulkSchema }),
	addTeamPlayersBulk
);
router.delete(
	'/:id/players/:userId',
	authorizeRoles('admin', 'technical_director', 'coach'),
	validate({ params: teamIdParamSchema.concat(removeTeamPlayerSchema) }),
	removeTeamPlayer
);

router.post('/', authorizeRoles('admin','technical_director'), validate({ body: createTeamSchema }), createTeam);
router.put('/:id', authorizeRoles('admin','technical_director'), validate({ params: idParamSchema, body: updateTeamSchema }), updateTeam);
router.delete('/:id', authorizeRoles('admin','technical_director'), validate({ params: idParamSchema }), deleteTeam);

module.exports = router;
