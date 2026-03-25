# src/modules/auth/

Authentication module. Handles login (credential verification + JWT issuance) and logout (stateless acknowledgement in phase 1).

## Routes

Mounted at `/api/v1/auth` via `src/routes/index.js`. No authentication middleware is applied to this router — all auth routes are public.

| Method | Path | Middleware | Handler |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | `validate(loginSchema)` | `authController.login` |
| `POST` | `/api/v1/auth/logout` | — | `authController.logout` |

## Files

### `auth.validator.js`

Joi schema for the login endpoint body.

**`loginSchema`** requires:
- `password` — string, required.
- At least one of `username` (string) or `email` (valid email format).

If neither `username` nor `email` is provided, validation fails with `400` before the controller is called.

### `auth.repository.js`

Data access layer for identity lookups. Accesses the `User` model via `sequelize.models.User`.

| Function | Query |
|---|---|
| `findUserByUsername(sequelize, username)` | `User.findOne({ where: { username } })` |
| `findUserByEmail(sequelize, email)` | `User.findOne({ where: { email } })` |

Both return the full user record (including `passwordHash`) or `null`.

### `auth.service.js`

Business logic for authentication.

**`login(credentials, sequelize)`**

1. Looks up the user by `username` or `email` via the repository.
2. If the user does not exist, throws `AppError(401, 'Invalid credentials.')`.
3. Calls `verifyPassword(password, user.passwordHash)`.
4. If the password does not match, throws `AppError(401, 'Invalid credentials.')`.
   - The same message is used for both not-found and wrong-password to prevent username enumeration.
5. Builds `{ userId, username }` payload, calls `createAccessToken(payload)`.
6. Returns `{ accessToken, user: { id, username } }`.

**`logout(context)`**

Phase 1 stateless logout. Returns `{ success: true }` without any server-side state change. Revocation hooks (token blacklist, refresh-token invalidation) attach here in a future phase without changing the route contract.

### `auth.controller.js`

Thin transport layer. All handlers are wrapped in `asyncHandler`.

- **`login`** — Calls `authService.login(req.body, sequelize)`, responds `200` with `{ accessToken, user }`.
- **`logout`** — Calls `authService.logout(req.auth)`, responds `204 No Content`.

## Response Contracts

**`POST /api/v1/auth/login` — success**

```json
HTTP 200
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "user": { "id": 1, "username": "alice" }
  }
}
```

**`POST /api/v1/auth/login` — invalid credentials**

```json
HTTP 401
{ "success": false, "message": "Invalid credentials." }
```

**`POST /api/v1/auth/logout`**

```
HTTP 204 No Content
```
