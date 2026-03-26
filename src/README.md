# src/

The `src/` directory is the root of the modular backend architecture. It contains the two top-level entry files and all feature subdirectories.

## Files

### `server.js`

The process entry point. Responsibilities:

- Requires `config/env.js` first, which loads `.env` and validates all required environment variables. If any required variable is missing, the process exits immediately.
- Calls `initDatabase()` to authenticate the Oracle connection pool before accepting traffic.
- Calls `createApp()` to build the configured Express application.
- Attaches `app.locals.db = { sequelize, models }` so controllers can access the database context through `req.app.locals.db`.
- Calls `app.listen()` and logs the active port and environment.
- Catches any startup error and exits the process with code 1.

### `app.js`

Express application factory. Exported as `createApp()` — never calls `listen` itself.

Responsibilities:

- Enables `trust proxy` for accurate IP logging behind a reverse proxy.
- Registers global middleware in a security-first order:
	1. Morgan request logger
	2. API ingress validation (`validateApiIngress`) for method/content-type/payload checks
	3. Global IP rate limiter (`ipRateLimiter`)
	4. CORS policy
	5. Helmet security headers
	6. JSON parser with policy-driven body size limits
	7. URL-encoded parser
- Mounts the root API router at `/api/v1`.
- Registers the not-found handler and the centralized error handler at the bottom of the stack, after all routes.

## Subdirectories

| Directory | Description |
|---|---|
| [`config/`](config/README.md) | Environment config and centralized security policy constants |
| [`routes/`](routes/README.md) | Root `/api/v1` router with protection boundaries for public/protected routes |
| [`middleware/`](middleware/README.md) | JWT auth, ingress validation, CSRF, rate limiting, error handling, 404 handler |
| [`common/`](common/README.md) | Shared utilities: `AppError`, `asyncHandler`, HTTP response helpers |
| [`infrastructure/`](infrastructure/README.md) | Oracle/Sequelize database layer and security lifecycle utilities |
| [`modules/`](modules/README.md) | Feature modules: `auth` (login/refresh/logout) and `users` |
| [`models/`](models/README.md) | Sequelize model definitions (factory functions) |
