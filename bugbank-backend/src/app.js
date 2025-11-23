// src/app.js
// Production-ready Express app with Sentry, request IDs, rate limits, Swagger docs, and routes.
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Sentry (optional if SENTRY_DSN provided)
const Sentry = require('@sentry/node');

const errorHandler = require('../middleware/errorHandler');
const requestId = require('../middleware/requestId');
const { apiLimiter, authLimiter } = require('../middleware/rateLimits');

// Swagger (OpenAPI) docs
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('../utils/swagger');

function createApp() {
  const app = express();

  // Sentry init (safe no-op if DSN missing)
  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV || 'development' });
    app.use(Sentry.Handlers.requestHandler());
  }

  // Security & basics
  app.use(helmet());
  app.disable('x-powered-by');

  // CORS
  const corsOrigins = (process.env.FRONTEND_URL || '').split(',').map(s => s.trim()).filter(Boolean);
  app.use(cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
  }));

  // Request ID for correlation
  app.use(requestId());

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging (with request id)
  morgan.token('id', (req) => req.id || '-');
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms id=:id'));

  // Rate limits (global + auth-specific)
  app.use('/api', apiLimiter);
  app.use('/api/auth', authLimiter);

  // Docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // API routes
  app.use('/api/auth', require('../routes/auth'));
  app.use('/api/bugs', require('../routes/bugs'));
  app.use('/api/leaderboard', require('../routes/leaderboard'));
  app.use('/api/users', require('../routes/users'));
  app.use('/api/admin', require('../routes/admin'));

  // Health endpoints
  app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));
  app.get('/ready', (req, res) => res.json({ ready: true }));
  app.get('/version', (req, res) => res.json({ version: process.env.APP_VERSION || 'dev' }));

  // Sentry error handler first (if enabled), then our JSON error
  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }
  app.use(errorHandler);

  return app;
}

module.exports = createApp();
