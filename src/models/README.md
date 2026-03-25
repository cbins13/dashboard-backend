# src/models/

Sequelize model definitions for the modular `src/` architecture. Each model is defined as a factory function that accepts a `sequelize` instance and `DataTypes`, following the same pattern as the legacy `models/` directory.

## Files

### `index.js`

Model registry. Called once by `infrastructure/db/oracle.js` when the Sequelize instance is first created.

- Imports each model factory function.
- Calls each factory with `(sequelize, DataTypes)`.
- Returns a plain object mapping model names to their Sequelize model classes:

```js
{ User: <SequelizeModel> }
```

The returned object is stored as `app.locals.db.models` and also accessible through `sequelize.models` within repositories.

### `User.js`

Factory function `defineUser(sequelize, DataTypes)`.

**Table:** `USERS` (Oracle schema `CHRISTIAN2`, configured in `models/modelSchemas.js`)

**Columns:**

| Field | Oracle column | Type | Constraints |
|---|---|---|---|
| `id` | `ID` | `INTEGER` | Primary key, auto-increment, not null |
| `username` | `USERNAME` | `VARCHAR2(100)` | Not null, unique |
| `email` | `EMAIL` | `VARCHAR2(255)` | Not null, unique |
| `passwordHash` | `PASSWORD_HASH` | `VARCHAR2(255)` | Not null |

**Options:**

- `tableName: 'USERS'`, `freezeTableName: true` — prevents Sequelize from pluralizing the table name.
- `timestamps: false` — no `createdAt`/`updatedAt` columns managed by Sequelize.

**Security note:** The `passwordHash` field stores a bcrypt hash only. Plain-text passwords are never stored. The field is excluded from controller responses — only `id`, `username`, and `email` are returned to API consumers.
