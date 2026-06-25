const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// POST /auth/register  — create new company account
router.post('/register', auth.register);

// POST /auth/login     — login, get JWT
router.post('/login', auth.login);

// GET  /auth/me        — get current company profile (protected)
router.get('/me', authMiddleware, auth.me);

module.exports = router;
