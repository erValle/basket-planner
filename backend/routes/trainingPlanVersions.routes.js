const express = require('express');
const router = express.Router({ mergeParams: true });
const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const {
	createTrainingPlanVersionSchema,
	updateTrainingPlanVersionSchema,
	restoreTrainingPlanVersionSchema,
} = require('../src/validation/trainingPlanVersionSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listVersions, listVersionsPaged, getVersion, createVersion, updateVersion, restoreVersion, deleteVersion } = require('../src/controllers/trainingPlanVersionController');
const { createNewVersion } = require('../src/controllers/trainingPlanNewVersionController');
const { setActiveVersion } = require('../src/controllers/trainingPlanActiveVersionController');

router.use(authenticateToken);

router.get('/', listVersions);
router.get('/paged', listVersionsPaged);
router.get('/:id', getVersion);
router.post('/', authorizeRoles('admin','technical_director','coach'), validate({ body: createTrainingPlanVersionSchema }), createVersion);
router.post('/new', authorizeRoles('admin','technical_director','coach'), createNewVersion);
router.put('/:id', authorizeRoles('admin','technical_director','coach'), validate({ body: updateTrainingPlanVersionSchema }), updateVersion);
router.post('/:id/restore', authorizeRoles('admin','technical_director','coach'), validate({ params: idParamSchema, body: restoreTrainingPlanVersionSchema }), restoreVersion);
router.post('/:id/activate', authorizeRoles('admin','technical_director','coach'), validate({ params: idParamSchema }), setActiveVersion);
router.delete('/:id', authorizeRoles('admin','technical_director','coach'), deleteVersion);

module.exports = router;
