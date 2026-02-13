const express = require('express');
const router = express.Router({ mergeParams: true });
const validate = require('../src/middlewares/validate');
const { requireAuth, requireAnyRole } = require('../src/middlewares/rbac');
const {
  createTrainingPlanVersionSchema,
  updateTrainingPlanVersionSchema,
  restoreTrainingPlanVersionSchema,
} = require('../src/validation/trainingPlanVersionSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const {
  listVersions,
  listVersionsPaged,
  getVersion,
  createVersion,
  updateVersion,
  restoreVersion,
  deleteVersion,
} = require('../src/controllers/trainingPlanVersionController');
const { createNewVersion } = require('../src/controllers/trainingPlanNewVersionController');
const { setActiveVersion } = require('../src/controllers/trainingPlanActiveVersionController');

router.use(requireAuth);

// GET  /versions Listar versiones - todos autenticados
router.get('/', listVersions);
// POST /versions Crear versión - admin, technical_director, coach
router.post(
  '/',
  requireAnyRole('admin', 'technical_director', 'coach'),
  validate({ body: createTrainingPlanVersionSchema }),
  createVersion
);

// GET /versions/paged Listar versiones paginadas - todos autenticados
router.get('/paged', listVersionsPaged);

// POST /versions/new Crear nueva versión desde activa - admin, technical_director, coach
router.post('/new', requireAnyRole('admin', 'technical_director', 'coach'), createNewVersion);

// GET    /versions/:id Ver versión - todos autenticados
router.get('/:id', getVersion);
// PUT    /versions/:id Editar versión - admin, technical_director, coach
router.put(
  '/:id',
  requireAnyRole('admin', 'technical_director', 'coach'),
  validate({ body: updateTrainingPlanVersionSchema }),
  updateVersion
);
// DELETE /versions/:id Eliminar versión - admin, technical_director, coach
router.delete('/:id', requireAnyRole('admin', 'technical_director', 'coach'), deleteVersion);

// POST /versions/:id/restore Restaurar versión - admin, technical_director, coach
router.post(
  '/:id/restore',
  requireAnyRole('admin', 'technical_director', 'coach'),
  validate({ params: idParamSchema, body: restoreTrainingPlanVersionSchema }),
  restoreVersion
);

// POST /versions/:id/activate Activar versión - admin, technical_director, coach
router.post(
  '/:id/activate',
  requireAnyRole('admin', 'technical_director', 'coach'),
  validate({ params: idParamSchema }),
  setActiveVersion
);

module.exports = router;
