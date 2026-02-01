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
const { listVersions, listVersionsPaged, getVersion, createVersion, updateVersion, restoreVersion, deleteVersion } = require('../src/controllers/trainingPlanVersionController');
const { createNewVersion } = require('../src/controllers/trainingPlanNewVersionController');
const { setActiveVersion } = require('../src/controllers/trainingPlanActiveVersionController');

router.use(requireAuth);

// ==================== /versions ====================
// GET  /versions - CU.027: Listar versiones - todos autenticados
router.get('/', listVersions);
// POST /versions - CU.025: Crear versión - admin, technical_director, coach
router.post('/', requireAnyRole('admin', 'technical_director', 'coach'), validate({ body: createTrainingPlanVersionSchema }), createVersion);

// ==================== /versions/paged ====================
// GET /versions/paged - CU.027: Listar versiones paginadas - todos autenticados
router.get('/paged', listVersionsPaged);

// ==================== /versions/new ====================
// POST /versions/new - CU.025: Crear nueva versión desde activa - admin, technical_director, coach
router.post('/new', requireAnyRole('admin', 'technical_director', 'coach'), createNewVersion);

// ==================== /versions/:id ====================
// GET    /versions/:id - CU.027: Ver versión - todos autenticados
router.get('/:id', getVersion);
// PUT    /versions/:id - CU.025: Editar versión - admin, technical_director, coach
router.put('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ body: updateTrainingPlanVersionSchema }), updateVersion);
// DELETE /versions/:id - CU.025: Eliminar versión - admin, technical_director, coach
router.delete('/:id', requireAnyRole('admin', 'technical_director', 'coach'), deleteVersion);

// ==================== /versions/:id/restore ====================
// POST /versions/:id/restore - CU.025: Restaurar versión - admin, technical_director, coach
router.post('/:id/restore', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema, body: restoreTrainingPlanVersionSchema }), restoreVersion);

// ==================== /versions/:id/activate ====================
// POST /versions/:id/activate - CU.025: Activar versión - admin, technical_director, coach
router.post('/:id/activate', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema }), setActiveVersion);

module.exports = router;
