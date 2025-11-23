const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Bug = require('../models/Bug');
const XPTransaction = require('../models/XPTransaction');
const User = require('../models/User');

// GET /api/users/me
router.get('/me', auth, async (req, res, next) => {
  res.json(req.user);
});

// GET /api/users/:id/profile
router.get('/:id/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name xp badges github createdAt');
    if (!user) return res.status(404).json({ error: 'Not found' });
    const solved = await Bug.find({ assignee: user._id, status: 'solved' }).limit(50);
    res.json({ user, solved });
  } catch (err) { next(err); }
});

// GET /api/users/:id/xp
router.get('/:id/xp', async (req, res, next) => {
  try {
    const tx = await XPTransaction.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(100);
    res.json(tx);
  } catch (err) { next(err); }
});

module.exports = router;
