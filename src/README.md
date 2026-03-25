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
- Registers global middleware in order: CORS, JSON body parser, URL-encoded body parser, Morgan request logger, Helmet security headers.
- Mounts the root API router at `/api/v1`.
- Registers the not-found handler and the centralized error handler at the bottom of the stack, after all routes.

## Subdirectories

| Directory | Description |
|---|---|
| [`config/`](config/README.md) | Environment config, CORS options, security header options |
| [`routes/`](routes/README.md) | Root `/api/v1` router — single mount point for all feature routers |
| [`middleware/`](middleware/README.md) | JWT authentication, request validation, error handling, 404 handler |
| [`common/`](common/README.md) | Shared utilities: `AppError`, `asyncHandler`, HTTP response helpers |
| [`infrastructure/`](infrastructure/README.md) | Oracle/Sequelize database layer and JWT/bcrypt security utilities |
| [`modules/`](modules/README.md) | Feature modules: `auth` and `users` |
| [`models/`](models/README.md) | Sequelize model definitions (factory functions) |
