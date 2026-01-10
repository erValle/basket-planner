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

router.get('/', listFeedbacks);
router.get('/:id', validate({ params: idParamSchema }), getFeedback);

// CU.029: Crear feedback - admin, technical_director, coach, player
router.post('/', requireAnyRole('admin', 'technical_director', 'coach', 'player'), validate({ body: createFeedbackSchema }), createFeedback);

// Actualizar/eliminar feedback - admin, technical_director, coach
router.put('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema, body: updateFeedbackSchema }), updateFeedback);
router.delete('/:id', requireAnyRole('admin', 'technical_director'), validate({ params: idParamSchema }), deleteFeedback);

// New endpoints for feedback workflow
router.get('/version/:versionId/can-provide', checkCanProvideFeedback);
router.get('/version/:versionId/stats', getVersionStats);
router.get('/version/:versionId/session/:sessionId/stats', getSessionStats);

module.exports = router;
