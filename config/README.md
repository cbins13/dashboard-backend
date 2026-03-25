# config/ (legacy)

Root-level configuration helpers used by the legacy `server.js` entry point. These files are kept for backwards compatibility while `npm run dev:legacy` and `npm run start:legacy` are in use. The modular architecture under `src/` uses `src/config/` instead.

## Files

### `initializeServer.js`

Registers global Express middleware on the app instance passed to it:

- `cors` with options from `corsOptions.js`
- `express.json()` and `express.urlencoded({ extended: true })`
- `morgan` (combined format) for HTTP request logging
- `helmet` with Content Security Policy for `script-src`

Called from the top-level `server.js` as `initializeServer(express, app)`.

### `initializeRouting.js`

Mounts legacy route handlers onto the app:

- `GET /api/persons` and related CRUD routes → `routes/personRoutes.js`

Called from the top-level `server.js` as `initializeRouting(app)`.

### `corsOptions.js`

CORS configuration object. Allows origins in the `allowedOrigins` array and rejects others with an error. `optionsSuccessStatus: 200` is set for compatibility.

### `allowedOrigins.js`

Array of permitted CORS origins, populated from `process.env.FRONTEND_URL`.
