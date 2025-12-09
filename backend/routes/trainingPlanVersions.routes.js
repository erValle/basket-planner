const express = require('express');
const router = express.Router({ mergeParams: true });
const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const { createTrainingPlanVersionSchema, updateTrainingPlanVersionSchema } = require('../src/validation/trainingPlanVersionSchemas');
const { listVersions, getVersion, createVersion, updateVersion, deleteVersion } = require('../src/controllers/trainingPlanVersionController');

router.use(authenticateToken);

router.get('/', listVersions);
router.get('/:id', getVersion);
router.post('/', authorizeRoles('admin','technical_director','coach'), validate({ body: createTrainingPlanVersionSchema }), createVersion);
router.put('/:id', authorizeRoles('admin','technical_director','coach'), validate({ body: updateTrainingPlanVersionSchema }), updateVersion);
router.delete('/:id', authorizeRoles('admin','technical_director','coach'), deleteVersion);

module.exports = router;
