# BugBank Backend (Node.js / Express / MongoDB)

BugBank is a gamified bug-bounty style platform where users submit bugs, claim them, resolve them, and earn XP.  
This repository contains the **backend API** built with **Node.js, Express, MongoDB, and Redis (optional)**.  
It is designed with production-readiness in mind: logging, rate-limiting, request IDs, Swagger docs, tests, and optional Sentry integration.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB (Atlas or self-hosted)
- **Cache (optional):** Redis (for leaderboard caching)
- **Auth:** JWT (JSON Web Tokens)
- **File uploads:** Multer + Cloudinary (for screenshots)
- **Validation & Security:**
  - express-validator
  - express-rate-limit
  - helmet
  - CORS
- **Logging:**
  - Winston + Daily Rotate File
  - Request IDs middleware
- **Documentation:** Swagger (OpenAPI) via `swagger-ui-express`
- **Testing:** Jest + Supertest + mongodb-memory-server
- **Process Manager (optional):** PM2

---

## Features

- User registration & login (email + password, hashed with bcrypt)
- Role-aware flows (reporters, solvers, admins)
- CRUD APIs for bugs:
  - Create bug reports with optional image attachments
  - List / filter / search bugs
  - Claim bug, mark as resolved, status updates
- XP & leaderboard system:
  - XP awarded for successful resolutions
  - Leaderboard endpoints, with optional Redis caching
- Admin APIs:
  - View users and bugs
  - Basic moderation hooks
- Observability:
  - Structured logging with daily log files
  - Request correlation IDs in logs
  - Optional Sentry error tracking (via `SENTRY_DSN`)
- API Documentation:
  - Auto-generated OpenAPI spec at `/api/docs`
- Tests:
  - Jest + Supertest integration tests (MongoDB in-memory)

---

## Project Structure

```text
bugbank-backend/
  config/
    cloudinary.js
    db.js
    redis.js
  controllers/
    adminController.js
    authController.js
    bugController.js
    leaderboardController.js
  logs/
    ... (runtime log files, gitignored)
  middleware/
    auth.js
    errorHandler.js
    rateLimits.js
    requestId.js
    roles.js
    upload.js
    validate.js
  models/
    Admin.js
    AuditLog.js
    Bug.js
    User.js
    XPTransaction.js
  routes/
    admin.js
    auth.js
    bugs.js
    leaderboard.js
    users.js
  scripts/
    fix-username-index.js          # optional maintenance script
  src/
    app.js                         # Express app factory
  tests/
    integration/
      flow.test.js
    auth.test.js
  utils/
    logger.js
    swagger.js
  server.js                        # App entry point
  pm2.ecosystem.config.js          # Optional PM2 config
  package.json
  README.md
