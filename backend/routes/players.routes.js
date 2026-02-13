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

// GET /players - Listado de jugadores - technical_director, coach
router.get(
  '/',
  requireAnyRole('technical_director', 'coach'),
  validate({ query: playerQuerySchema }),
  playersController.listPlayers
);

// POST /players/enroll - Inscribir jugador (crear perfil de jugador) - solo admin (registra usuarios)
router.post(
  '/enroll',
  requireAnyRole('admin'),
  validate({ body: enrollPlayerSchema }),
  playersController.enrollPlayer
);

// PUT /players/:id - Edición de perfil jugador - solo Director Técnico (gestiona jugadores de su club)
router.put(
  '/:id',
  requireAnyRole('technical_director'),
  validate({ params: idParamSchema, body: updatePlayerProfileSchema }),
  playersController.updatePlayerProfile
);

// GET /players/:id/history - Historial de jugador - technical_director, coach, player (propio)
router.get(
  '/:id/history',
  requireAnyRole('technical_director', 'coach', 'player'),
  validate({ params: idParamSchema }),
  playersController.getPlayerHistory
);

// POST /players/:id/transfer - Transferir jugador - SOLO Director Técnico puede transferir
router.post(
  '/:id/transfer',
  requireAnyRole('technical_director'),
  validate({ params: idParamSchema, body: transferPlayerSchema }),
  playersController.transferPlayer
);

module.exports = router;
