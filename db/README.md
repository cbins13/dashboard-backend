# db/ (legacy)

Legacy Oracle database connection layer used by the root-level `server.js` and `routes/personRoutes.js`. The modular architecture under `src/` re-implements this functionality in `src/infrastructure/db/`. These files are kept for backwards compatibility.

## Files

### `oracleClient.js`

Initializes the Oracle Instant Client for thick mode.

- Reads `ORACLE_CLIENT_MODE` to decide whether thick mode is needed.
- Reads `ORACLE_CLIENT_LIB_DIR` for the Instant Client library path (required only in thick mode).
- Calls `oracledb.initOracleClient({ libDir })` at most once per process (guarded by a flag).
- Exported functions: `initializeOracleClient()`, `isThickModeEnabled()`.

### `connectionPool.js`

Sequelize instance management and database bootstrap.

- Validates that `ORACLE_DB_USER`, `ORACLE_DB_PASSWORD`, and `ORACLE_DB_CONNECT_STRING` are set.
- Creates a Sequelize instance with `dialect: 'oracle'` and pool settings from environment variables.
- Registers all models via `models/index.js` (legacy).
- Exported functions:
  - `getSequelize()` — returns or creates the shared Sequelize instance.
  - `getModels()` — returns the registered model map.
  - `initDatabase()` — authenticates the connection and logs success.

### `schemaContext.js`

Runtime Oracle schema targeting utilities. Validates schema names against the Oracle unquoted identifier format and an optional allow-list, then issues `ALTER SESSION SET CURRENT_SCHEMA` inside a transaction.

- `getLoginSchema()` — normalized `ORACLE_DB_USER` schema name.
- `getDefaultSchema()` — `ORACLE_DEFAULT_SCHEMA` or falls back to login schema.
- `resolveSchema(name, label)` — validates and allow-lists a schema name.
- `resolveRequestSchema(req)` — resolves schema from `x-db-schema` header, `?schema=` query, or default.
- `resolveConfiguredSchema()` — resolves from `ORACLE_TARGET_SCHEMA` or default.
- `withTargetSchema(sequelize, name, work)` — runs a transaction-scoped callback with the session schema set to `name`.
