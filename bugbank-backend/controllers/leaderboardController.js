const User = require('../models/User');
const { getRedis } = require('../config/redis');
const logger = require('../utils/logger');

exports.getTop = async (req, res, next) => {
  try {
    const limit = Math.min(50, Number(req.query.limit) || 10);
    const redis = getRedis();

    const CACHE_KEY = 'leaderboard_top_users';

    // ---- Check Redis Cache ----
    if (redis) {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        logger.info('Leaderboard served from cache');
        return res.json(JSON.parse(cached));
      }
    }

    // ---- DB Query ----
    const users = await User.find()
      .select('name xp solvedCount badges github')  // ⭐ ADDED solvedCount here
      .sort({ xp: -1 })
      .limit(limit)
      .lean();

    // ---- Save to Cache ----
    if (redis) {
      await redis.set(CACHE_KEY, JSON.stringify(users), 'EX', 30); // 30 seconds cache
    }

    res.json(users);
  } catch (err) {
    next(err);
  }
};
