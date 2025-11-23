// controllers/adminController.js
const User = require('../models/User');
const Bug = require('../models/Bug');
const AuditLog = require('../models/AuditLog');

// GET /api/admin/users
exports.listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find().select('name email role xp badges github createdAt').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments({})
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// GET /api/admin/bugs
exports.listBugs = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const q = (req.query.q || '').trim();
    const status = req.query.status && req.query.status !== 'all' ? req.query.status : undefined;
    const severity = req.query.severity && req.query.severity !== 'all' ? req.query.severity : undefined;

    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (q) filter.$text = { $search: q };

    const [items, total] = await Promise.all([
      Bug.find(filter).populate('reporter', 'name email').populate('assignee', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Bug.countDocuments(filter)
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// POST /api/admin/bugs/:id/close
exports.closeBug = async (req, res, next) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ error: 'Not found' });
    if (bug.status === 'closed') return res.status(400).json({ error: 'Already closed' });
    bug.status = 'closed';
    await bug.save();
    await AuditLog.create({ actor: req.user._id, action: 'BUG_CLOSED', targetType: 'Bug', targetId: String(bug._id), metadata: {} });
    res.json({ success: true, status: bug.status });
  } catch (err) { next(err); }
};

// POST /api/admin/bugs/:id/reopen
exports.reopenBug = async (req, res, next) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ error: 'Not found' });
    if (bug.status !== 'closed') return res.status(400).json({ error: 'Bug is not closed' });
    bug.status = 'open';
    await bug.save();
    await AuditLog.create({ actor: req.user._id, action: 'BUG_REOPENED', targetType: 'Bug', targetId: String(bug._id), metadata: {} });
    res.json({ success: true, status: bug.status });
  } catch (err) { next(err); }
};

// GET /api/admin/audits
exports.listAudits = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      AuditLog.find().populate('actor', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments({})
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};
