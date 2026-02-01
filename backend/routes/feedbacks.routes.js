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

// ==================== /feedbacks ====================
// GET  /feedbacks - Listar feedbacks - todos autenticados
router.get('/', listFeedbacks);
// POST /feedbacks - CU.029: Crear feedback - admin, technical_director, coach, player
router.post('/', requireAnyRole('admin', 'technical_director', 'coach', 'player'), validate({ body: createFeedbackSchema }), createFeedback);

// ==================== /feedbacks/version/:versionId/can-provide ====================
// GET /feedbacks/version/:versionId/can-provide - Verificar si puede dar feedback
// NOTA: Rutas específicas deben ir ANTES de las genéricas /:id
router.get('/version/:versionId/can-provide', checkCanProvideFeedback);

// ==================== /feedbacks/version/:versionId/stats ====================
// GET /feedbacks/version/:versionId/stats - Estadísticas de feedback de versión
router.get('/version/:versionId/stats', getVersionStats);

// ==================== /feedbacks/version/:versionId/session/:sessionId/stats ====================
// GET /feedbacks/version/:versionId/session/:sessionId/stats - Estadísticas de feedback de sesión
router.get('/version/:versionId/session/:sessionId/stats', getSessionStats);

// ==================== /feedbacks/:id ====================
// GET    /feedbacks/:id - Ver feedback
router.get('/:id', validate({ params: idParamSchema }), getFeedback);
// PUT    /feedbacks/:id - Actualizar feedback - admin, technical_director, coach
router.put('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema, body: updateFeedbackSchema }), updateFeedback);
// DELETE /feedbacks/:id - Eliminar feedback - admin, technical_director
router.delete('/:id', requireAnyRole('admin', 'technical_director'), validate({ params: idParamSchema }), deleteFeedback);

module.exports = router;
