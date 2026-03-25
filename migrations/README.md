# migrations/

Sequelize migration scripts that create or drop database tables. Run by `scripts/migrate.js` via the `npm run migrate` family of commands.

## Files

### `001-create-person-table.js`

Creates or drops the `PERSON` table in the Oracle schema pinned for the `Person` model.

**Up (apply):**

- Resolves the target schema from `models/modelSchemas.js`.
- Uses `withTargetSchema` to run the DDL inside a schema-scoped transaction.
- Creates table `PERSON` with columns: `ID` (NUMBER PK), `NAME` (VARCHAR2 255), `AGE` (NUMBER), `HEIGHT` (NUMBER).

**Down (rollback):**

- Resolves the same pinned schema.
- Drops table `PERSON`.

## Running Migrations

```bash
# Apply all pending migrations
npm run migrate

# Roll back the most recent migration
npm run migrate:undo

# Roll back all migrations
npm run migrate:clear
```

Migration state is tracked in the Oracle table named by `MIGRATIONS_TABLE_NAME` (default `SEQUELIZE_META`).
