// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const authController = require('../controllers/authController');
const auth = require('../middleware/auth'); // ⭐ for /me route

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('name').isLength({ min: 2 }),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['reporter', 'solver', 'admin']),
  ],
  authController.signup
);

// POST /api/auth/login
router.post(
  '/login',
  [body('email').isEmail(), body('password').exists()],
  authController.login
);

// ⭐ NEW: GET /api/auth/me  → current logged-in user with fresh stats
router.get('/me', auth, authController.me);

module.exports = router;
