// config/redis.js
const IORedis = require('ioredis');
const logger = require('../utils/logger');

let redisClient;

function initRedis() {
  if (redisClient) return redisClient;
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = process.env.REDIS_PORT || 6379;
  const user = process.env.REDIS_USER || '';
  const pass = process.env.REDIS_PASS || '';
  const protocol = process.env.REDIS_TLS === 'true' ? 'rediss' : 'redis';
  const auth = pass ? (user ? `${user}:${pass}@` : `:${pass}@`) : '';
  const redisUrl = process.env.REDIS_URL || `${protocol}://${auth}${host}:${port}`;

  redisClient = new IORedis(redisUrl, {
    password: pass || undefined,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined
  });
  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('error', (e) => logger.error('Redis error', e.message));
  return redisClient;
}

module.exports = { initRedis, getRedis: () => redisClient };
