const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../src/middlewares/rbac');
const { login, me } = require('../src/controllers/authController');
const validate = require('../src/middlewares/validate');
const { loginSchema } = require('../src/validation/authSchemas');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// ==================== /auth/login ====================
// POST /auth/login - CU.001: Autenticación - todos los roles (rate limited: 5/min)
router.post('/login', loginLimiter, validate({ body: loginSchema }), login);

// ==================== /auth/me ====================
// GET /auth/me - Obtener usuario actual - requiere autenticación
router.get('/me', requireAuth, me);

module.exports = router;
