const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../src/middlewares/rbac');
const { login, me, changePassword } = require('../src/controllers/authController');
const validate = require('../src/middlewares/validate');
const { loginSchema, changePasswordSchema } = require('../src/validation/authSchemas');

const loginLimiter = rateLimit({windowMs: 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false});

// CU.001: Autenticación - todos los roles
router.post('/login', loginLimiter, validate({ body: loginSchema }), login);
router.get('/me', requireAuth, me);
router.post('/change-password', requireAuth, validate({ body: changePasswordSchema }), changePassword);

module.exports = router;