const express = require('express');
const router = express.Router({ mergeParams: true });
const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const { createTrainingPlanVersionSchema, updateTrainingPlanVersionSchema } = require('../src/validation/trainingPlanVersionSchemas');
const { idParamSchema } = require('../src/validation/commonSchemas');
const { listVersions, getVersion, createVersion, updateVersion, deleteVersion } = require('../src/controllers/trainingPlanVersionController');
const { setActiveVersion } = require('../src/controllers/trainingPlanActiveVersionController');

router.use(authenticateToken);

router.get('/', listVersions);
router.get('/:id', getVersion);
router.post('/', authorizeRoles('admin','technical_director','coach'), validate({ body: createTrainingPlanVersionSchema }), createVersion);
router.put('/:id', authorizeRoles('admin','technical_director','coach'), validate({ body: updateTrainingPlanVersionSchema }), updateVersion);
router.post('/:id/activate', authorizeRoles('admin','technical_director','coach'), validate({ params: idParamSchema }), setActiveVersion);
router.delete('/:id', authorizeRoles('admin','technical_director','coach'), deleteVersion);

module.exports = router;
