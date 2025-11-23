const fs = require('fs');
const path = require('path');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const Bug = require('../models/Bug');
const User = require('../models/User');

/* ---------------------------------------------
   Image Upload (Cloudinary or Local Fallback)
--------------------------------------------- */
async function storeImage(buffer, originalname) {
  if (cloudinary?.uploader?.upload_stream) {
    const uploadFromBuffer = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'bugbank/bugs', resource_type: 'image' },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    const r = await uploadFromBuffer();
    return { url: r.secure_url, publicId: r.public_id };
  }

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const safeName = `${Date.now()}-${(originalname || 'image').replace(/[^\w.-]/g, '_')}`;
  const filePath = path.join(uploadsDir, safeName);
  fs.writeFileSync(filePath, buffer);
  return { url: `/uploads/${safeName}`, filename: safeName };
}

/* ---------------------------------------------
   GET /api/bugs  → only active bugs (open + in_progress)
--------------------------------------------- */
exports.listBugs = async (req, res, next) => {
  try {
    const query = { status: { $in: ['open', 'in_progress'] } };
    const bugs = await Bug.find(query)
      .sort({ createdAt: -1 })
      .select('_id title description severity status rewardXP images createdAt')
      .lean();

    res.json(bugs);
  } catch (err) {
    next(err);
  }
};

/* ---------------------------------------------
   GET /api/bugs/:id
--------------------------------------------- */
exports.getBug = async (req, res, next) => {
  try {
    const bug = await Bug.findById(req.params.id)
      .populate('reporter', 'name email')
      .populate('claimedBy', 'name email')
      .populate('acceptedSolver', 'name email')
      .populate('submissions.solver', 'name email')
      .lean();

    if (!bug) return res.status(404).json({ error: 'Not found' });

    res.json(bug);
  } catch (err) {
    next(err);
  }
};

/* ---------------------------------------------
   POST /api/bugs  (create)
--------------------------------------------- */
exports.createBug = async (req, res, next) => {
  try {
    const { title, description, severity = 'low', rewardXP = 0 } = req.body;

    const doc = {
      title,
      description,
      severity,
      rewardXP: Number(rewardXP) || 0,
      reporter: req.user._id,
    };

    const allFiles = [];
    if (req.files?.images?.length) allFiles.push(...req.files.images);
    if (req.files?.image?.length) allFiles.push(...req.files.image);

    if (allFiles.length) {
      const uploaded = [];
      for (const f of allFiles) {
        uploaded.push(await storeImage(f.buffer, f.originalname));
      }
      doc.images = uploaded;
    }

    const bug = await Bug.create(doc);
    res.status(201).json(bug);
  } catch (err) {
    next(err);
  }
};

/* ---------------------------------------------
   POST /api/bugs/:id/claim
--------------------------------------------- */
exports.claimBug = async (req, res, next) => {
  try {
    if (req.user.role !== 'solver') {
      return res.status(403).json({ error: 'Only solvers can claim' });
    }

    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ error: 'Not found' });

    if (String(bug.reporter) === String(req.user._id)) {
      return res.status(400).json({ error: 'Reporter cannot claim own bug' });
    }
    if (bug.status === 'closed') {
      return res.status(400).json({ error: 'Bug is closed' });
    }
    if (bug.claimedBy) {
      return res.status(400).json({ error: 'Already claimed by someone else' });
    }

    bug.claimedBy = req.user._id;
    if (bug.status === 'open') bug.status = 'in_progress';
    await bug.save();

    res.json({ ok: true, status: bug.status });
  } catch (err) {
    next(err);
  }
};

/* ---------------------------------------------
   POST /api/bugs/:id/submit-fix
--------------------------------------------- */
exports.submitFix = async (req, res, next) => {
  try {
    const { snippet = '', prLink = '' } = req.body;
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ error: 'Not found' });

    if (bug.status === 'closed') {
      return res.status(400).json({ error: 'Bug is closed' });
    }

    if (String(bug.reporter) === String(req.user._id)) {
      return res.status(403).json({ error: 'Cannot submit on your own bug' });
    }

    const already = bug.submissions.some(
      s => String(s.solver) === String(req.user._id)
    );
    if (already) {
      return res.status(400).json({ error: 'You already submitted' });
    }

    bug.submissions.push({
      solver: req.user._id,
      snippet,
      prLink,
      decision: 'pending',
      awarded: false,
    });

    if (bug.status === 'open') bug.status = 'in_progress';

    await bug.save();
    res.json({ ok: true, status: bug.status });
  } catch (err) {
    next(err);
  }
};

/* ---------------------------------------------
   POST /api/bugs/:id/verify  (accept)
--------------------------------------------- */
exports.verifyFix = async (req, res, next) => {
  try {
    const { submissionId } = req.body;
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ error: 'Not found' });

    if (String(bug.reporter) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only reporter can verify' });
    }

    const sub = bug.submissions.id(submissionId);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    // Accept this one
    sub.decision = 'accepted';
    sub.awarded = true;

    // Un-accept others
    bug.submissions.forEach(s => {
      if (String(s._id) !== String(sub._id)) {
        s.decision = 'pending';
        s.awarded = false;
      }
    });

    bug.acceptedSolver = sub.solver;
    bug.status = 'resolved';
    bug.rewardClaimed = false;
    bug.resolvedAt = new Date();

    await bug.save();

    res.json({ ok: true, status: bug.status });
  } catch (err) {
    next(err);
  }
};

/* ---------------------------------------------
   POST /api/bugs/:id/reject
--------------------------------------------- */
exports.rejectSolution = async (req, res, next) => {
  try {
    const { submissionId, comment = '' } = req.body;

    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ error: 'Not found' });

    if (String(bug.reporter) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only reporter can reject' });
    }

    const sub = bug.submissions.id(submissionId);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });

    sub.decision = 'rejected';
    sub.comment = comment;
    sub.awarded = false;

    // If all rejected → reopen bug
    const anyPending = bug.submissions.some(s => s.decision !== 'rejected');

    if (!anyPending) {
      bug.status = 'open';
      bug.acceptedSolver = undefined;
      bug.resolvedAt = undefined;
      bug.rewardClaimed = false;

      // reset all submissions to pending to allow retry
      bug.submissions.forEach(s => {
        s.decision = 'pending';
        s.comment = '';
      });
    }

    await bug.save();
    res.json({ ok: true, status: bug.status });
  } catch (err) {
    next(err);
  }
};

/* ---------------------------------------------
   POST /api/bugs/:id/claim-reward
--------------------------------------------- */
exports.claimReward = async (req, res, next) => {
  try {
    const bug = await Bug.findById(req.params.id);
    if (!bug) return res.status(404).json({ error: 'Not found' });

    if (bug.status !== 'resolved') {
      return res.status(400).json({ error: 'Bug not resolved' });
    }
    if (bug.rewardClaimed) {
      return res.status(400).json({ error: 'Already claimed' });
    }
    if (String(bug.acceptedSolver) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not your reward' });
    }

    const reward = Number(bug.rewardXP) || 0;

    await User.updateOne(
      { _id: req.user._id },
      {
        $inc: { xp: reward, solvedCount: 1 },
        $set: { lastXPClaimedAt: new Date() },
      }
    );

    bug.rewardClaimed = true;
    bug.rewardClaimedAt = new Date();
    bug.status = 'closed';
    bug.claimedBy = undefined; // clean this field

    await bug.save();

    res.json({ ok: true, reward, status: 'closed' });
  } catch (err) {
    next(err);
  }
};

/* =============================================
   PHASE 2: "My Bugs" APIs
   --------------------------------------------
   - myReportedBugs      → bugs where reporter = me
   - mySolvedBugs        → bugs where acceptedSolver = me
   - myPendingRewards    → resolved + acceptedSolver = me + !rewardClaimed
============================================= */

/* GET /api/bugs/my/reported */
exports.myReportedBugs = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const bugs = await Bug.find({ reporter: userId })
      .sort({ createdAt: -1 })
      .select(
        '_id title description severity status rewardXP images createdAt resolvedAt acceptedSolver rewardClaimed'
      )
      .lean();

    res.json(bugs);
  } catch (err) {
    next(err);
  }
};

/* GET /api/bugs/my/solved */
exports.mySolvedBugs = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const bugs = await Bug.find({ acceptedSolver: userId })
      .sort({ resolvedAt: -1, createdAt: -1 })
      .select(
        '_id title description severity status rewardXP images createdAt resolvedAt rewardClaimed'
      )
      .lean();

    res.json(bugs);
  } catch (err) {
    next(err);
  }
};

/* GET /api/bugs/my/pending-rewards */
exports.myPendingRewards = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const bugs = await Bug.find({
      acceptedSolver: userId,
      status: 'resolved',
      rewardClaimed: false,
    })
      .sort({ resolvedAt: -1 })
      .select(
        '_id title description severity status rewardXP images createdAt resolvedAt rewardClaimed'
      )
      .lean();

    res.json(bugs);
  } catch (err) {
    next(err);
  }
};
