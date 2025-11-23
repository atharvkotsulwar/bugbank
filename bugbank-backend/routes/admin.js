// bugbank-backend/routes/admin.js
/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: List users (admin)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 */
const express = require('express');
const router = express.Router();

// If you already have these, the paths are correct.
// If your middlewares live under src/middleware, use '../src/middleware/...'
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');

const admin = require('../controllers/adminController');

router.use(auth, requireRole('admin'));

router.get('/users', admin.listUsers);
router.get('/bugs', admin.listBugs);
router.post('/bugs/:id/close', admin.closeBug);
router.post('/bugs/:id/reopen', admin.reopenBug);
router.get('/audits', admin.listAudits);

module.exports = router;
