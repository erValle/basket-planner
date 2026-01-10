const express = require('express');
const router = express.Router();

const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { playerQuerySchema } = require('../src/validation/playerSchemas');
const { enrollPlayerSchema } = require('../src/validation/playerEnrollSchemas');
const { updatePlayerProfileSchema } = require('../src/validation/playerUpdateSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { transferPlayerSchema } = require('../src/validation/playerTransferSchemas');
const playersController = require('../src/controllers/playersController');

router.use(requireAuth);

// CU.011: Listado de jugadores - admin, technical_director, coach
router.get('/', requireAnyRole('admin', 'technical_director', 'coach'), validate({ query: playerQuerySchema }), playersController.listPlayers);

// CU.011: Enroll player - admin, technical_director, coach
router.post(
	'/enroll',
	requireAnyRole('admin', 'technical_director', 'coach'),
	validate({ body: enrollPlayerSchema }),
	playersController.enrollPlayer
);

// CU.015: Historial de jugador - admin, technical_director, coach, player (propio)
router.get(
	'/:id/history',
	requireAnyRole('admin', 'technical_director', 'coach', 'player'),
	validate({ params: idParamSchema }),
	playersController.getPlayerHistory
);

// CU.012: Edición de perfil jugador - admin, technical_director, coach
router.put(
  '/:id',
  requireAnyRole('admin', 'technical_director', 'coach'),
  validate({ params: idParamSchema, body: updatePlayerProfileSchema }),
  playersController.updatePlayerProfile
);

// CU.014: Transferir jugador - admin, technical_director (su club), coach (su club)
router.post(
	'/:id/transfer',
	requireAnyRole('admin', 'technical_director', 'coach'),
	validate({ params: idParamSchema, body: transferPlayerSchema }),
	playersController.transferPlayer
);

module.exports = router;
