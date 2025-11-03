const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../src/middlewares/auth');
const { login, me, changePassword } = require('../src/controllers/authController');

const loginLimiter = rateLimit({windowMs: 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false});

router.post('/login', loginLimiter, login);
router.get('/me', authenticateToken, me);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;