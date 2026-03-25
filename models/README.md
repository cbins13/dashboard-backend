# models/ (legacy)

Legacy Sequelize model definitions used by the root-level `server.js` and `routes/personRoutes.js`. The modular `src/` architecture uses `src/models/` instead. These files are retained for backwards compatibility.

## Files

### `index.js`

Model registry. Called by `db/connectionPool.js` when the Sequelize instance is initialized.

- Imports `definePerson` from `Person.js`.
- Returns `{ Person: definePerson(sequelize, DataTypes) }`.

### `Person.js`

Factory function `definePerson(sequelize, DataTypes)`.

**Table:** `PERSON` (schema pinned to `CHRISTIAN2` via `modelSchemas.js`)

**Columns:**

| Field | Type | Constraints |
|---|---|---|
| `id` | `INTEGER` | Primary key, auto-increment, not null |
| `name` | `STRING(255)` | Not null |
| `age` | `INTEGER` | Nullable |
| `height` | `DECIMAL(5,2)` | Nullable |

Options: `tableName: 'PERSON'`, `freezeTableName: true`, `timestamps: false`.

### `modelSchemas.js`

Static schema binding registry. Maps model names to their fixed Oracle schema.

```js
{
  Person: 'CHRISTIAN2',
  Users: 'CHRISTIAN2'
}
```

`getModelSchema(modelName)` looks up the binding and validates it through `resolveSchema`. If a model is pinned here, any conflicting runtime schema override is rejected with an error.
