const express = require('express');
const router = express.Router();
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const { createFeedbackSchema, updateFeedbackSchema } = require('../src/validation/feedbackSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const {
  listFeedbacks,
  getFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  checkCanProvideFeedback,
  getVersionStats,
  getSessionStats,
} = require('../src/controllers/feedbackController');

router.use(requireAuth);

// GET  /feedbacks - Listar feedbacks - todos autenticados (jugadores ven solo los suyos)
router.get('/', listFeedbacks);
// POST /feedbacks - Crear feedback - Director Técnico, Entrenador y Jugador
router.post(
  '/',
  requireAnyRole('technical_director', 'coach', 'player'),
  validate({ body: createFeedbackSchema }),
  createFeedback
);

// GET /feedbacks/version/:versionId/can-provide - Verificar si puede dar feedback
router.get('/version/:versionId/can-provide', checkCanProvideFeedback);

// GET /feedbacks/version/:versionId/stats - Estadísticas de feedback de versión
router.get('/version/:versionId/stats', getVersionStats);

// GET /feedbacks/version/:versionId/session/:sessionId/stats - Estadísticas de feedback de sesión
router.get('/version/:versionId/session/:sessionId/stats', getSessionStats);

// GET    /feedbacks/:id - Ver feedback (todos autenticados)
router.get('/:id', validate({ params: idParamSchema }), getFeedback);
// PUT    /feedbacks/:id - Actualizar feedback - Director Técnico, Entrenador y Jugador (propio)
router.put(
  '/:id',
  requireAnyRole('technical_director', 'coach', 'player'),
  validate({ params: idParamSchema, body: updateFeedbackSchema }),
  updateFeedback
);
// DELETE /feedbacks/:id - Eliminar feedback - solo Director Técnico
router.delete(
  '/:id',
  requireAnyRole('technical_director'),
  validate({ params: idParamSchema }),
  deleteFeedback
);

module.exports = router;
