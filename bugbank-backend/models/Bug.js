const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ----------------------------------------------------------------------
   Submission (one solution attempt)
------------------------------------------------------------------------*/
const SubmissionSchema = new Schema({
  solver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  snippet: { type: String },
  prLink: { type: String },

  // NEW unified accept/reject/pending flow
  decision: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  comment: { type: String }, // rejection or review note

  createdAt: { type: Date, default: Date.now },
});

/* ----------------------------------------------------------------------
   Image schema
------------------------------------------------------------------------*/
const ImageSchema = new Schema({
  url: String,
  publicId: String,
  filename: String,
});

/* ----------------------------------------------------------------------
   Bug schema
   Lifecycle:
   open → claimed → in_progress → resolved → closed
------------------------------------------------------------------------*/
const BugSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },

  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  },

  status: {
    type: String,
    enum: ['open', 'claimed', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  },

  rewardXP: { type: Number, default: 0 },

  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  // legacy “claimer” flow — we keep it so old bugs don't break
  claimedBy: { type: Schema.Types.ObjectId, ref: 'User' },

  images: [ImageSchema],
  submissions: [SubmissionSchema],

  // NEW: the actual solver whose solution was accepted
  acceptedSolver: { type: Schema.Types.ObjectId, ref: 'User' },

  // NEW: reward flow
  rewardClaimed: { type: Boolean, default: false },
  rewardClaimedAt: { type: Date },

  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
});

module.exports = mongoose.model('Bug', BugSchema);
