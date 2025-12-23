const express = require('express');
const router = express.Router();

const validate = require('../src/middlewares/validate');
const { authenticateToken, authorizeRoles } = require('../src/middlewares/auth');
const { createFeedbackSchema } = require('../src/validation/feedbackSchemas');
const { createFeedback } = require('../src/controllers/feedbackController');

router.use(authenticateToken);

router.post('/', authorizeRoles('admin','technical_director','coach','player'), validate({ body: createFeedbackSchema }), createFeedback);

module.exports = router;
