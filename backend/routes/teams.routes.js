const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
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

router.use(requireAuth);

// CU.008/009: Todos pueden listar/ver equipos
router.get('/', listTeams);
router.get('/:id', validate({ params: idParamSchema }), getTeam);

// Players management for teams - admin, technical_director, coach
router.get(
	'/:id/players',
	requireAnyRole('admin', 'technical_director', 'coach'),
	validate({ params: teamIdParamSchema, query: listTeamPlayersQuerySchema }),
	listTeamPlayers
);
router.post(
	'/:id/players',
	requireAnyRole('admin', 'technical_director', 'coach'),
	validate({ params: teamIdParamSchema, body: addTeamPlayerSchema }),
	addTeamPlayer
);

router.post(
	'/:id/players/bulk',
	requireAnyRole('admin', 'technical_director', 'coach'),
	validate({ params: teamIdParamSchema, body: addTeamPlayersBulkSchema }),
	addTeamPlayersBulk
);
router.delete(
	'/:id/players/:userId',
	requireAnyRole('admin', 'technical_director', 'coach'),
	validate({ params: teamIdParamSchema.concat(removeTeamPlayerSchema) }),
	removeTeamPlayer
);

// CU.008: Creación de equipos - admin, technical_director (su club), coach (su club)
router.post('/', requireAnyRole('admin', 'technical_director', 'coach'), validate({ body: createTeamSchema }), createTeam);

// CU.009: Edición de equipos - admin, technical_director (su club), coach (sus equipos)
router.put('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema, body: updateTeamSchema }), updateTeam);

// CU.010: Eliminación de equipos - solo admin
router.delete('/:id', requireAnyRole('admin'), validate({ params: idParamSchema }), deleteTeam);

module.exports = router;
