const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const {
  createTeamSchema,
  updateTeamSchema,
  listTeamsQuerySchema,
} = require('../src/validation/teamSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
} = require('../src/controllers/teamController');
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
// GET  /teams - Todos pueden listar equipos (autenticados)
router.get('/', validate({ query: listTeamsQuerySchema }), listTeams);
// POST /teams - Solo Director Técnico puede crear equipos de su club
router.post(
  '/',
  requireAnyRole('technical_director'),
  validate({ body: createTeamSchema }),
  createTeam
);

// ==================== /teams/:id ====================
// GET    /teams/:id - Ver equipo (todos autenticados)
router.get('/:id', validate({ params: idParamSchema }), getTeam);
// PUT    /teams/:id - Solo Director Técnico puede editar equipos de su club
router.put(
  '/:id',
  requireAnyRole('technical_director'),
  validate({ params: idParamSchema, body: updateTeamSchema }),
  updateTeam
);
// DELETE /teams/:id - Solo Director Técnico puede eliminar equipos de su club
router.delete(
  '/:id',
  requireAnyRole('technical_director'),
  validate({ params: idParamSchema }),
  deleteTeam
);

// ==================== /teams/:id/players ====================
// GET  /teams/:id/players - Listar jugadores del equipo - technical_director, coach (solo lectura)
router.get(
  '/:id/players',
  requireAnyRole('technical_director', 'coach'),
  validate({ params: teamIdParamSchema, query: listTeamPlayersQuerySchema }),
  listTeamPlayers
);
// POST /teams/:id/players - Añadir jugador al equipo - solo Director Técnico
router.post(
  '/:id/players',
  requireAnyRole('technical_director'),
  validate({ params: teamIdParamSchema, body: addTeamPlayerSchema }),
  addTeamPlayer
);

// ==================== /teams/:id/players/bulk ====================
// POST /teams/:id/players/bulk - Añadir múltiples jugadores - solo Director Técnico
router.post(
  '/:id/players/bulk',
  requireAnyRole('technical_director'),
  validate({ params: teamIdParamSchema, body: addTeamPlayersBulkSchema }),
  addTeamPlayersBulk
);

// ==================== /teams/:id/players/:userId ====================
// DELETE /teams/:id/players/:userId - Eliminar jugador del equipo - solo Director Técnico
router.delete(
  '/:id/players/:userId',
  requireAnyRole('technical_director'),
  validate({ params: teamIdParamSchema.concat(removeTeamPlayerSchema) }),
  removeTeamPlayer
);

module.exports = router;
