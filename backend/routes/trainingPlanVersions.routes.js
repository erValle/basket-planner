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

// CU.027: Visualización de versiones - todos autenticados
router.get('/', listVersions);
router.get('/paged', listVersionsPaged);
router.get('/:id', getVersion);

// CU.025: Versionado - admin, technical_director, coach
router.post('/', requireAnyRole('admin', 'technical_director', 'coach'), validate({ body: createTrainingPlanVersionSchema }), createVersion);
router.post('/new', requireAnyRole('admin', 'technical_director', 'coach'), createNewVersion);
router.put('/:id', requireAnyRole('admin', 'technical_director', 'coach'), validate({ body: updateTrainingPlanVersionSchema }), updateVersion);
router.post('/:id/restore', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema, body: restoreTrainingPlanVersionSchema }), restoreVersion);
router.post('/:id/activate', requireAnyRole('admin', 'technical_director', 'coach'), validate({ params: idParamSchema }), setActiveVersion);
router.delete('/:id', requireAnyRole('admin', 'technical_director', 'coach'), deleteVersion);

module.exports = router;
