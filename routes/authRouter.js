const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../src/middlewares/auth');
const { login, me, changePassword } = require('../src/controllers/authController');
const validate = require('../src/middlewares/validate');
const { loginSchema, changePasswordSchema } = require('../src/validation/authSchemas');

const loginLimiter = rateLimit({windowMs: 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false});

router.post('/login', loginLimiter, validate({ body: loginSchema }), login);
router.get('/me', authenticateToken, me);
router.post('/change-password', authenticateToken, validate({ body: changePasswordSchema }), changePassword);

module.exports = router;