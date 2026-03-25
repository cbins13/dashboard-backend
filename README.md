# dashboard-backend

A modular REST API backend built with **Express 5**, **Node-oracledb**, and **Sequelize** (Oracle dialect). It provides JWT-based authentication and a versioned API foundation designed to serve a React/Vite SPA.

## Technology Stack

| Package | Version | Purpose |
|---|---|---|
| `express` | ^5 | HTTP server and routing |
| `sequelize` | ^6 | ORM with Oracle dialect |
| `oracledb` | ^6 | Oracle database driver (thin or thick mode) |
| `jsonwebtoken` | ^9 | JWT access token signing and verification |
| `bcrypt` | ^6 | Password hashing |
| `joi` | ^18 | Request body validation |
| `cors` | ^2 | Cross-origin resource sharing |
| `helmet` | ^8 | HTTP security headers |
| `morgan` | ^1 | HTTP request logging |
| `dotenv` | ^17 | Environment variable loading |
| `nodemon` | ^3 | Development auto-restart (dev only) |

## API Overview

All routes are versioned under `/api/v1`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | Issue a JWT access token |
| `POST` | `/api/v1/auth/logout` | Public | Acknowledge logout (stateless phase 1) |
| `GET` | `/api/v1/users` | Bearer JWT | List all users |
| `POST` | `/api/v1/users` | Bearer JWT | Create a user |
| `PATCH` | `/api/v1/users/:userId` | Bearer JWT | Update a user |
| `DELETE` | `/api/v1/users/:userId` | Bearer JWT | Delete a user |

Legacy route (flat structure, still active):

| Method | Path | Description |
|---|---|---|
| `GET/POST/PATCH/DELETE` | `/api/persons` | Person CRUD (legacy module) |

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example below into a `.env` file at the project root and fill in your values:

```env
# Server
PORT_DEV=3005
NODE_ENV=development

# Frontend origin allowed by CORS
FRONTEND_URL=http://localhost:5173

# JWT
ACCESS_TOKEN_SECRET=replace_with_a_long_random_secret
ACCESS_TOKEN_EXPIRES_IN=15m

# Oracle connection
ORACLE_DB_USER=your_oracle_user
ORACLE_DB_PASSWORD=your_oracle_password
ORACLE_DB_CONNECT_STRING=host:port/service

# Oracle Instant Client (only required when ORACLE_CLIENT_MODE=thick)
ORACLE_CLIENT_MODE=thin
ORACLE_CLIENT_LIB_DIR=

# Schema config
ORACLE_DEFAULT_SCHEMA=CHRISTIAN2
ORACLE_ALLOWED_SCHEMAS=CHRISTIAN2
ORACLE_TARGET_SCHEMA=CHRISTIAN2

# Connection pool
ORACLE_POOL_MAX=5
ORACLE_POOL_MIN=0
ORACLE_POOL_ACQUIRE=30000
ORACLE_POOL_IDLE=10000

# Sequelize
SEQUELIZE_LOGGING=false
MIGRATIONS_TABLE_NAME=SEQUELIZE_META
```

Required variables — the server refuses to start if any are missing:
- `ACCESS_TOKEN_SECRET`
- `ORACLE_DB_USER`
- `ORACLE_DB_PASSWORD`
- `ORACLE_DB_CONNECT_STRING`

### 3. Run database migrations

```bash
npm run migrate
```

Rollback one step:

```bash
npm run migrate:undo
```

Clear all migrations:

```bash
npm run migrate:clear
```

### 4. Seed sample data (optional)

```bash
npm run seed:persons:reset
```

### 5. Start the server

Development (auto-restart on file change):

```bash
npm run dev
```

Production:

```bash
npm run start
```

The server starts on the port defined by `PORT_DEV` (default `3005`).

### 6. Verify

```http
POST http://localhost:3005/api/v1/auth/login
Content-Type: application/json

{ "username": "alice", "password": "secret123" }
```

## Project Structure

```
dashboard-backend/
├── src/                        New modular architecture
│   ├── server.js               Entry point — db init + app.listen
│   ├── app.js                  Express app factory
│   ├── config/                 Environment config, CORS, security headers
│   ├── routes/                 Root API router (/api/v1)
│   ├── middleware/             authenticate, validate, errorHandler, notFound
│   ├── common/                 AppError, asyncHandler, HTTP response helpers
│   ├── infrastructure/         Oracle/Sequelize DB layer, JWT/bcrypt utilities
│   ├── modules/                Feature modules (auth, users)
│   └── models/                 Sequelize model definitions
├── config/                     Legacy server/routing initializers
├── db/                         Legacy Oracle connection pool and schema context
├── models/                     Legacy Sequelize model definitions
├── routes/                     Legacy Express route handlers
├── migrations/                 Sequelize migration scripts
├── scripts/                    CLI helper scripts (migrate, seed)
└── sample-data/                JSON seed fixtures
```

Each directory contains its own `README.md` with detailed documentation.

## npm Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `nodemon src/server.js` | Start modular server with auto-restart |
| `start` | `node src/server.js` | Start modular server |
| `dev:legacy` | `nodemon server.js` | Start legacy flat server |
| `start:legacy` | `node server.js` | Start legacy flat server |
| `migrate` | `node scripts/migrate.js` | Run pending migrations |
| `migrate:undo` | `node scripts/migrate.js undo` | Rollback last migration |
| `migrate:clear` | `node scripts/migrate.js undo:all` | Rollback all migrations |
| `seed:persons` | `node scripts/seedPersons.js` | Seed persons table |
| `seed:persons:reset` | `node scripts/seedPersonsReset.js` | Clear and reseed persons table |

## Oracle Client Modes

**Thin mode** (default): No Oracle Instant Client installation required. Set `ORACLE_CLIENT_MODE=thin`.

**Thick mode**: Requires Oracle Instant Client to be installed. Set:

```env
ORACLE_CLIENT_MODE=thick
ORACLE_CLIENT_LIB_DIR=C:\oracle\instantclient_21_15
```

## 1. Prerequisites

Before configuring schemas, ensure these are ready:

- Oracle Instant Client is installed (for thick mode)
- Oracle user has privileges on target schemas/tables
- Node dependencies are installed

```bash
npm install
```

## 2. Configure Environment Variables

Set your `.env` file.

Example:

```env
PORT_DEV=3000

ORACLE_CLIENT_MODE=thick
ORACLE_CLIENT_LIB_DIR=C:\oracle\instantclient_23_5

ORACLE_DB_USER=APP_USER
ORACLE_DB_PASSWORD=YOUR_PASSWORD
ORACLE_DB_CONNECT_STRING=localhost:1521/FREEPDB1

# fallback schema for requests/scripts when model is not pinned
ORACLE_DEFAULT_SCHEMA=SAMPLE

# comma-separated allow-list for all runtime schema targets
ORACLE_ALLOWED_SCHEMAS=SAMPLE,SAMPLE2

# used by seed scripts if model is not pinned
ORACLE_TARGET_SCHEMA=SAMPLE

ORACLE_POOL_MAX=5
ORACLE_POOL_MIN=0
ORACLE_POOL_ACQUIRE=30000
ORACLE_POOL_IDLE=10000
SEQUELIZE_LOGGING=false
MIGRATIONS_TABLE_NAME=SEQUELIZE_META
```

## 3. Pin Models to Specific Schemas

Edit `models/modelSchemas.js`.

Current example:

```js
const modelSchemas = {
    Person: 'SAMPLE',
    Users: 'SAMPLE2',
};
```

Meaning:

- `Person` is always enforced on schema `SAMPLE`
- `Users` is intended to be enforced on schema `SAMPLE2` once the model/migration exists

If a model is pinned here, conflicting overrides are rejected.

## 4. How Request Schema Resolution Works

For `Person` routes:

1. If `Person` is pinned in `models/modelSchemas.js`, that pinned schema wins
2. If request sends `x-db-schema` or `?schema=`, it must match pinned schema
3. If model is not pinned, request falls back to:
   - `x-db-schema`
   - `?schema=`
   - `ORACLE_DEFAULT_SCHEMA`
   - `ORACLE_DB_USER`

Allow-list check:

- Any resolved schema must be in `ORACLE_ALLOWED_SCHEMAS` when allow-list is set

## 5. Create the Person Table (Migration)

Run migration:

```bash
npm run migrate
```

The `Person` migration (`migrations/001-create-person-table.js`) uses the model schema registry, so table `PERSON` is created in the schema pinned for `Person`.

Rollback options:

```bash
npm run migrate:undo
npm run migrate:clear
```

## 6. Seed Data Into Person Table

Use sample insert:

```bash
npm run seed:persons
```

Or clear + reseed:

```bash
npm run seed:persons:reset
```

For `Person`, seed scripts enforce the pinned model schema. If `ORACLE_TARGET_SCHEMA` conflicts with the pinned schema, seeding fails with a validation error.

## 7. Start the API

```bash
npm run dev
```

or

```bash
npm run start
```

## 8. Verify via API

Get all persons:

```http
GET /api/persons
```

Get one person:

```http
GET /api/persons/:id
```

Optional schema override header/query (must match pinned schema for `Person`):

```http
x-db-schema: SAMPLE
```

or

```http
GET /api/persons?schema=SAMPLE
```

## 9. Add a New Model With Its Own Schema

When adding `Users` model:

1. Add model definition in `models/Users.js`
2. Register model in `models/index.js`
3. Add migration (example: `migrations/002-create-users-table.js`)
4. Use `getModelSchema('Users')` in migration to build table reference
5. Keep `Users: 'SAMPLE2'` in `models/modelSchemas.js`

This ensures `Users` table is created and used only in `SAMPLE2`.

## 10. Common Errors

### Schema not allowed
Cause: resolved schema is not in `ORACLE_ALLOWED_SCHEMAS`
Fix: include it in the allow-list.

### Schema mismatch for pinned model
Cause: request/seed tries to use a schema different from model pin
Fix: use the model's pinned schema or update pin intentionally.

### Missing privileges
Cause: Oracle login user lacks access to target schema objects
Fix: grant needed privileges/synonyms in Oracle.

---

If you want, a next step is to add full `Users` model + migration + routes using the same per-model schema enforcement pattern.
