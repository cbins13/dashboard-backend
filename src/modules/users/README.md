# src/modules/users/

Users module. Provides protected CRUD endpoints and serves as the primary example of how feature modules are structured. All routes require a valid JWT access token.

## Routes

Mounted at `/api/v1/users` via `src/routes/index.js`. The `authenticate` middleware is applied at the mount point in `routes/index.js` — not inside this router — so every endpoint in this module is protected by default.

| Method | Path | Middleware | Handler |
|---|---|---|---|
| `GET` | `/api/v1/users` | — | `usersController.getUsers` |
| `POST` | `/api/v1/users` | `validate(createUserSchema)` | `usersController.createUser` |
| `PATCH` | `/api/v1/users/:userId` | `validate(updateUserSchema)` | `usersController.updateUser` |
| `DELETE` | `/api/v1/users/:userId` | — | `usersController.deleteUser` |

All routes require `Authorization: Bearer <token>` in the request header.

## Files

### `users.validator.js`

Joi schemas for request body validation.

**`createUserSchema`** — required fields:
- `username` — string, min 1, max 100 characters.
- `email` — valid email address.
- `password` — string, minimum 8 characters.

**`updateUserSchema`** — all fields optional, but at least one must be present (rejects empty body):
- `username`, `email`, `password` — same constraints as above but optional.

### `users.repository.js`

All database queries for the `User` model. Receives `sequelize` as a parameter.

| Function | Description |
|---|---|
| `findAll(sequelize)` | `User.findAll()` — returns all user records |
| `findById(sequelize, userId)` | `User.findByPk(userId)` — returns one user or `null` |
| `create(sequelize, data)` | `User.create(data)` — inserts and returns the new record |
| `update(sequelize, userId, data)` | `User.update(...)` then `findByPk` — returns updated record or `null` if not found |
| `remove(sequelize, userId)` | `User.destroy({ where: { id } })` — returns affected row count |

### `users.service.js`

Business rules on top of the repository.

| Method | Behaviour |
|---|---|
| `getAll(sequelize)` | Delegates to `findAll` |
| `getById(sequelize, userId)` | Delegates to `findById`; throws `AppError(404)` if `null` |
| `create(sequelize, data)` | Hashes `data.password` with `hashPassword()`, stores `passwordHash`, delegates to `create` |
| `update(sequelize, userId, data)` | If `data.password` is present, hashes it and replaces it with `passwordHash` before updating; throws `AppError(404)` if no record was found |
| `remove(sequelize, userId)` | Delegates to `remove`; throws `AppError(404)` if `destroyed === 0` |

Passwords are **never stored as plaintext**. The service always converts `password` → `passwordHash` before the data reaches the repository.

### `users.controller.js`

Thin transport layer. All handlers are wrapped in `asyncHandler`.

- **`getUsers`** — `200` with array of user records.
- **`createUser`** — `201` with `{ id, username, email }` (password hash excluded from response).
- **`updateUser`** — `200` with `{ id, username, email }`.
- **`deleteUser`** — `204 No Content`.

## Response Contracts

**`GET /api/v1/users`**

```json
HTTP 200
{ "success": true, "data": [ { "id": 1, "username": "alice", "email": "alice@example.com" }, ... ] }
```

**`POST /api/v1/users`**

```json
HTTP 201
{ "success": true, "data": { "id": 2, "username": "bob", "email": "bob@example.com" } }
```

**`PATCH /api/v1/users/:userId`**

```json
HTTP 200
{ "success": true, "data": { "id": 2, "username": "bobby", "email": "bob@example.com" } }
```

**`DELETE /api/v1/users/:userId`**

```
HTTP 204 No Content
```

**When not authenticated:**

```json
HTTP 401
{ "success": false, "message": "Authorization header is required." }
```

**When token is invalid or expired:**

```json
HTTP 403
{ "success": false, "message": "Token invalid or unacceptable." }
```
