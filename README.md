# Oracle Schema Setup Guide

This guide explains how to configure and use schema targeting in this project.

The current implementation supports two levels:

1. Fixed schema per model (source of truth in `models/modelSchemas.js`)
2. Runtime session schema switching (`ALTER SESSION SET CURRENT_SCHEMA`) in `db/schemaContext.js`

## Quick Start

Use this flow if you want to run everything quickly.

1. Fill in `.env` with valid Oracle credentials and schema values.
2. Install dependencies:

```bash
npm install
```

3. Run migrations to create table(s):

```bash
npm run migrate
```

4. Seed sample data:

```bash
npm run seed:persons:reset
```

5. Start the API:

```bash
npm run dev
```

6. Verify endpoint:

```http
GET http://localhost:3000/api/persons
```

7. Optional schema-target test (must match model pin for `Person`):

```http
GET http://localhost:3000/api/persons?schema=SAMPLE
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
