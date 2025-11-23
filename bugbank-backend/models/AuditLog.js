// models/AuditLog.js
const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // e.g., BUG_CLOSED, BUG_REOPENED, BUG_VERIFIED, LOGIN
  targetType: { type: String, required: true }, // 'Bug' | 'User' | etc.
  targetId: { type: String, required: true },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
