# src/infrastructure/db/

Oracle database connection management and schema utilities. All Sequelize and Oracle-specific logic is isolated here so no other layer imports `oracledb` or `sequelize` directly.

## Files

### `sequelize.js`

Sequelize instance factory.

- Exports `createSequelizeInstance()`.
- Calls `initializeOracleClient()` for thick mode when `ORACLE_CLIENT_MODE=thick`, initializing the Oracle Instant Client libraries from `ORACLE_CLIENT_LIB_DIR`. Thick mode initialization is idempotent — it runs at most once per process.
- Creates and returns a `new Sequelize(...)` configured with:
  - `dialect: 'oracle'`
  - Oracle credentials and connect string from the config module
  - Connection pool settings (`max`, `min`, `acquire`, `idle`)
  - SQL query logging controlled by `SEQUELIZE_LOGGING`

### `oracle.js`

Public database API exposed to the rest of the application. Consumers import from this file only — they do not import from `sequelize.js` directly.

**Connection API:**

| Export | Description |
|---|---|
| `getSequelize()` | Returns the shared Sequelize instance (creates it on first call) |
| `getModels()` | Returns the registered models object (calls `getSequelize()` internally) |
| `initDatabase()` | Authenticates the Oracle connection and logs a success message. Must be awaited before `app.listen()`. |

**Schema utilities:**

| Export | Description |
|---|---|
| `getLoginSchema()` | Returns the validated Oracle login user schema name |
| `getDefaultSchema()` | Returns `ORACLE_DEFAULT_SCHEMA` or falls back to the login schema |
| `resolveSchema(name, label)` | Validates and normalizes a schema name, checks the allow-list |
| `resolveRequestSchema(req)` | Resolves schema from `x-db-schema` header, `?schema=` query, or default |
| `resolveConfiguredSchema()` | Resolves schema from `ORACLE_TARGET_SCHEMA` or default |
| `withTargetSchema(seq, name, work)` | Runs `work(transaction, schemaName)` inside a transaction after running `ALTER SESSION SET CURRENT_SCHEMA` |

**Schema validation rules:**

- Schema names must match the Oracle unquoted identifier pattern: start with a letter, contain only `A-Z 0-9 _ $ #`, max 30 characters.
- If `ORACLE_ALLOWED_SCHEMAS` is set, any resolved schema must be in that comma-separated list.
- Invalid or disallowed schema names throw an error immediately, preventing injection into `ALTER SESSION` statements.

**How `withTargetSchema` works:**

1. Opens a Sequelize transaction.
2. Issues `ALTER SESSION SET CURRENT_SCHEMA = <target>` inside the transaction.
3. Calls the `work` callback with the transaction and resolved schema name.
4. Resets the session schema back to the login schema (if different from target).
5. Commits on success; rolls back and re-throws on any failure.
