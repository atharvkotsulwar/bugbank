const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash:{ type: String, required: true },
  role:        { type: String, enum: ['reporter','solver','admin'], default: 'solver' },

  username:    { type: String },

  // gamification
  xp:          { type: Number, default: 0 },
  badges:      [{ type: String }],
  github:      { type: String },

  // ⭐ count of bugs solved (for leaderboard)
  solvedCount: { type: Number, default: 0 },

  // ⭐ for future (XP cooldown, achievements)
  lastXPClaimedAt: { type: Date },

  createdAt:   { type: Date, default: Date.now },
});

/** Partial unique index on username */
UserSchema.index(
  { username: 1 },
  { unique: true, partialFilterExpression: { username: { $type: 'string' } } }
);

module.exports = mongoose.model('User', UserSchema);
