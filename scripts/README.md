# scripts/

CLI helper scripts for database maintenance tasks. Run directly with `node` or through the `npm run` shortcuts defined in `package.json`.

## Files

### `migrate.js`

Migration runner. Reads all files in `migrations/` in alphabetical order, maintains a migration state table in Oracle (`MIGRATIONS_TABLE_NAME`), and runs pending `up()` or `down()` functions.

**Modes:**

| Command | Behaviour |
|---|---|
| `node scripts/migrate.js` | Run all pending migrations |
| `node scripts/migrate.js undo` | Roll back the most recently applied migration |
| `node scripts/migrate.js undo:all` | Roll back all applied migrations in reverse order |

### `seedPersons.js`

Inserts records from `sample-data/persons.json` into the `PERSON` table. Uses the schema pinned for the `Person` model. Does not clear existing data before inserting.

### `seedPersonsReset.js`

Deletes all existing rows from `PERSON` then re-inserts the full dataset from `sample-data/persons.json`. Use when you need a clean, predictable state.

## npm Shortcuts

```bash
npm run migrate              # apply pending migrations
npm run migrate:undo         # rollback last migration
npm run migrate:clear        # rollback all migrations
npm run seed:persons         # insert persons (additive)
npm run seed:persons:reset   # clear + reseed persons
```
