# routes/ (legacy)

Legacy Express route handlers used by the root-level `server.js` via `config/initializeRouting.js`. The modular architecture under `src/` replaces these with the `src/modules/` structure. These files are kept for backwards compatibility while `npm run dev:legacy` is in use.

## Files

### `personRoutes.js`

Full CRUD REST API for the `Person` resource.

**Endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/persons` | List all persons |
| `GET` | `/api/persons/:id` | Get one person by ID |
| `POST` | `/api/persons` | Create a person |
| `PATCH` | `/api/persons/:id` | Update a person (partial) |
| `DELETE` | `/api/persons/:id` | Delete a person |

**Schema targeting:**

Requests can specify an Oracle schema via:
- `x-db-schema` request header
- `?schema=` query parameter

If `Person` is pinned in `models/modelSchemas.js`, the request schema must match the pinned value or the request is rejected with `400`. If the model is not pinned, the schema falls back to `ORACLE_DEFAULT_SCHEMA` then `ORACLE_DB_USER`.

**Validation:**

Inline validation functions handle request bodies. `name` is required for create, optional for partial update. `age` must be an integer or `null`. `height` must be a finite number or `null`.

**Database access:**

Reads `req.app.locals.db.models.Person` and `req.app.locals.db.sequelize` set by the legacy `server.js` startup sequence.
