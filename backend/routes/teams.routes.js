const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { createTeamSchema, updateTeamSchema, listTeamsQuerySchema } = require('../src/validation/teamSchemas');
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

// ==================== /teams ====================
// GET  /teams - CU.008/009: Todos pueden listar equipos
router.get('/', validate({ query: listTeamsQuerySchema }), listTeams);
// POST /teams - CU.008: Creación de equipos - admin, technical_director (su club), coach (su club)
router.post('/', requireAnyRole('admin', 'technical_director', 'coach'), validate({ body: createTeamSchema }), createTeam);

// ==================== /teams/:id ====================
// GET    /teams/:id - CU.008/009: Ver equipo
router.get('/:id', validate({ params: idParamSchema }), getTeam);
// PUT    /teams/:id - CU.009: Edición de equipos - admin, technical_director (su club), coach (sus equipos)
router.put('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema, body: updateTeamSchema }), updateTeam);
// DELETE /teams/:id - CU.010: Eliminación de equipos - solo admin
router.delete('/:id', requireAnyRole('admin'), validate({ params: idParamSchema }), deleteTeam);

// ==================== /teams/:id/players ====================
// GET  /teams/:id/players - Listar jugadores del equipo - admin, technical_director, coach
router.get(
	'/:id/players',
	requireAnyRole('admin', 'technical_director', 'coach'),
	validate({ params: teamIdParamSchema, query: listTeamPlayersQuerySchema }),
	listTeamPlayers
);
// POST /teams/:id/players - Añadir jugador al equipo - admin, technical_director, coach
router.post(
	'/:id/players',
	requireAnyRole('admin', 'technical_director', 'coach'),
	validate({ params: teamIdParamSchema, body: addTeamPlayerSchema }),
	addTeamPlayer
);

// ==================== /teams/:id/players/bulk ====================
// POST /teams/:id/players/bulk - Añadir múltiples jugadores - admin, technical_director, coach
router.post(
	'/:id/players/bulk',
	requireAnyRole('admin', 'technical_director', 'coach'),
	validate({ params: teamIdParamSchema, body: addTeamPlayersBulkSchema }),
	addTeamPlayersBulk
);

// ==================== /teams/:id/players/:userId ====================
// DELETE /teams/:id/players/:userId - Eliminar jugador del equipo - admin, technical_director, coach
router.delete(
	'/:id/players/:userId',
	requireAnyRole('admin', 'technical_director', 'coach'),
	validate({ params: teamIdParamSchema.concat(removeTeamPlayerSchema) }),
	removeTeamPlayer
);

module.exports = router;
