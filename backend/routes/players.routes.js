const express = require('express');
const router = express.Router();

const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const { playerQuerySchema } = require('../src/validation/playerSchemas');
const { enrollPlayerSchema } = require('../src/validation/playerEnrollSchemas');
const { updatePlayerProfileSchema } = require('../src/validation/playerUpdateSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { transferPlayerSchema } = require('../src/validation/playerTransferSchemas');
const playersController = require('../src/controllers/playersController');

router.use(authenticateToken);

// Players are users with role=player.
// Allow coaches to list players too.
router.get('/', authorizeRoles('admin', 'technical_director', 'coach'), validate({ query: playerQuerySchema }), playersController.listPlayers);

// Enroll: turn an existing role=null user into a player.
router.post(
	'/enroll',
	authorizeRoles('admin', 'technical_director', 'coach'),
	validate({ body: enrollPlayerSchema }),
	playersController.enrollPlayer
);

// Membership history for a player (CU015)
router.get(
	'/:id/history',
	authorizeRoles('admin', 'technical_director', 'coach'),
	validate({ params: idParamSchema }),
	playersController.getPlayerHistory
);

// Restricted player profile update (player-only fields)
router.put(
  '/:id',
  authorizeRoles('admin', 'technical_director', 'coach'),
  validate({ params: idParamSchema, body: updatePlayerProfileSchema }),
  playersController.updatePlayerProfile
);

// Transfer player to another club (CU014)
router.post(
	'/:id/transfer',
	authorizeRoles('admin', 'technical_director'),
	validate({ params: idParamSchema, body: transferPlayerSchema }),
	playersController.transferPlayer
);

module.exports = router;
