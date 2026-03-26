# src/modules/auth/

Authentication module. Handles login, refresh-token rotation, and logout-family revocation.

## Routes

Mounted at `/api/v1/auth` via `src/routes/index.js`. No authentication middleware is applied to this router — all auth routes are public.

| Method | Path | Middleware | Handler |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | `loginRateLimiter`, `validate(loginSchema)` | `authController.login` |
| `POST` | `/api/v1/auth/refresh` | `validate(refreshSchema)` | `authController.refresh` |
| `POST` | `/api/v1/auth/logout` | `validate(logoutSchema)` | `authController.logout` |

## Files

### `auth.validator.js`

Joi schemas for auth endpoints.

**`loginSchema`** requires:
- `password` — string, required.
- At least one of `username` (string) or `email` (valid email format).

If neither `username` nor `email` is provided, validation fails with `400` before the controller is called.

**`refreshSchema`** requires:

- `refreshToken`
- `sessionId`

**`logoutSchema`** requires:

- `refreshToken`
- `familyId`

### `auth.repository.js`

Data access layer for identity lookups. Accesses the `User` model via `sequelize.models.User`.

| Function | Query |
|---|---|
| `findUserByUsername(sequelize, username)` | `User.findOne({ where: { username } })` |
| `findUserByEmail(sequelize, email)` | returns `null` (current USERS schema has no email column) |

This preserves generic auth semantics while avoiding invalid SQL against a non-existent `email` column.

### `auth.service.js`

Business logic for authentication.

**`login(credentials, sequelize, req)`**

1. Looks up the user by `username` or `email` via the repository.
2. Applies brute-force counters using request IP and login key context.
3. If the user does not exist, records failure and throws `AppError(401, 'Invalid credentials.')`.
4. Calls `verifyPassword(password, user.password)`.
4. If the password does not match, throws `AppError(401, 'Invalid credentials.')`.
   - The same message is used for both not-found and wrong-password to prevent username enumeration.
5. Clears failure counters on successful authentication.
6. Creates session context and refresh token family state.
7. Issues access token, refresh token, CSRF token, and session metadata.
8. Returns tokens and user summary.

**`refresh(payload, req)`**

1. Verifies refresh token cryptographically and validates session context.
2. Loads token family state and rejects revoked/invalid families.
3. Applies device binding checks using fingerprint similarity thresholds.
4. Rotates refresh token lineage and marks prior token consumed.
5. Issues fresh access/refresh/CSRF tokens.

**`logout(payload)`**

Revokes refresh token family state using `familyId` and returns success.

### `auth.controller.js`

Thin transport layer. All handlers are wrapped in `asyncHandler`.

- **`login`** — Calls `authService.login(req.body, sequelize, req)`, responds `200` with security token bundle.
- **`refresh`** — Calls `authService.refresh(req.body, req)`, responds `200` with rotated token bundle.
- **`logout`** — Calls `authService.logout(req.body)`, responds `204 No Content`.

## Response Contracts

**`POST /api/v1/auth/login` — success**

```json
HTTP 200
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "csrfToken": "<csrf>",
    "sessionId": "<session-id>",
    "familyId": "<family-id>",
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

**`POST /api/v1/auth/refresh` — success**

```json
HTTP 200
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "csrfToken": "<csrf>",
    "sessionId": "<session-id>",
    "familyId": "<family-id>"
  }
}
```
