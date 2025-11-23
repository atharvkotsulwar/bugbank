const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const bugController = require('../controllers/bugController');

/**
 * List bugs (server shows only open + in_progress by default)
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('q').optional().isString(),
  ],
  validate,
  bugController.listBugs
);

/* =====================================================
   MY BUGS — PHASE 2 ROUTES
   ===================================================== */

/**
 * 🔹 My bugs: reported by me
 */
router.get(
  '/my/reported',
  auth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  bugController.myReportedBugs   // ✅ FIXED
);

/**
 * 🔹 My bugs: solved by me (accepted solutions)
 */
router.get(
  '/my/solved',
  auth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  bugController.mySolvedBugs     // ✅ FIXED
);

/**
 * 🔹 My bugs: pending rewards
 */
router.get(
  '/my/pending-rewards',
  auth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  bugController.myPendingRewards  // ✅ FIXED
);

/**
 * Create bug (supports both single and multiple images)
 */
router.post(
  '/',
  auth,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 5 },
  ]),
  [
    body('title').isLength({ min: 3 }),
    body('description').isLength({ min: 10 }),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('rewardXP').optional().isInt({ min: 0 }),
  ],
  validate,
  bugController.createBug
);

/** Get a single bug */
router.get('/:id', bugController.getBug);

/** Optional: claim marker */
router.post('/:id/claim', auth, bugController.claimBug);

/**
 * Submit solution (submit-fix)
 */
router.post(
  '/:id/submit-fix',
  auth,
  [
    body('prLink').optional().isString(),
    body('snippet').optional().isString(),
  ],
  validate,
  bugController.submitFix
);

/**
 * Accept a solution (verifyFix)
 */
router.post(
  '/:id/verify',
  auth,
  [
    body('submissionId').exists().withMessage('submissionId required'),
    body('notes').optional().isString(),
  ],
  validate,
  bugController.verifyFix
);

/**
 * Reject a solution
 */
router.post(
  '/:id/reject',
  auth,
  [
    body('submissionId').exists().withMessage('submissionId required'),
    body('comment').optional().isString(),
  ],
  validate,
  bugController.rejectSolution
);

/**
 * Claim reward
 */
router.post('/:id/claim-reward', auth, bugController.claimReward);

module.exports = router;
