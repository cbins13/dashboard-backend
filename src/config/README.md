# src/config/

Application-level configuration. All environment variables are loaded and validated once here and exposed to the rest of the application through a frozen config object so no other file calls `dotenv` or reads `process.env` directly.

## Files

### `env.js`

The single entry point for environment variable access. Called first in `server.js` before any other module.

- Calls `require('dotenv').config()` — the only place in the codebase where this runs.
- Throws at startup with a descriptive message if any required variable is missing. Required variables:
  - `ACCESS_TOKEN_SECRET`
  - `ORACLE_DB_USER`
  - `ORACLE_DB_PASSWORD`
  - `ORACLE_DB_CONNECT_STRING`
- Exports a deeply frozen config object with the following shape:

```js
{
  port,              // PORT or PORT_DEV, default 3000
  nodeEnv,           // NODE_ENV, default 'development'
  frontendUrl,       // FRONTEND_URL (used by CORS)
  jwtAccessSecret,   // ACCESS_TOKEN_SECRET
  jwtAccessExpiresIn,// ACCESS_TOKEN_EXPIRES_IN, default '15m'
  jwtRefreshSecret,  // REFRESH_TOKEN_SECRET, falls back to ACCESS_TOKEN_SECRET
  jwtRefreshExpiresIn,// REFRESH_TOKEN_EXPIRES_IN, default '7d'
  oracle: {
    user, password, connectString,
    poolMax, poolMin, poolAcquire, poolIdle,
    clientMode,      // 'thin' or 'thick'
    clientLibDir,    // path for thick mode only
    defaultSchema, allowedSchemas, targetSchema
  },
  sequelizeLogging   // true/false — whether to log SQL queries
}
```

### `cors.js`

CORS policy for the Express application.

- Allows requests only from the origin matching `FRONTEND_URL`.
- Allows requests with no origin (non-browser tools such as Postman or server-to-server calls).
- Rejects all other origins.
- Sets `optionsSuccessStatus: 200` for compatibility with older browsers.

### `security.js`

Centralized backend security policy module.

Exports two objects:

- `helmetOptions` — passed into `helmet()` in `app.js`.
  - Locks down CSP defaults (`defaultSrc`, `scriptSrc`, `objectSrc`, `frameAncestors`).
  - Disables `crossOriginEmbedderPolicy` for compatibility with mixed clients.

- `securityPolicy` — all runtime security constants, including:
  - Token policy (`accessTokenTtl`, `refreshTokenTtl`, `issuer`, `audience`, CSRF TTL)
  - Payload limits (login, users CRUD, default)
  - Rate-limit thresholds (public, login, protected-user, block windows)
  - Device-binding thresholds and component weights
  - Password policy constraints

This keeps security defaults in one place so middleware and services share the same values.
