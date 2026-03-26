# src/middleware/

Reusable Express middleware. Each file exports a single middleware function or factory.

## Files

### `validateRequest.js`

Global API ingress guard used near the top of `app.js`.

**Responsibilities:**

- Enforces an HTTP method allowlist (`GET`, `POST`, `PATCH`, `DELETE`).
- Enforces JSON `Content-Type` for body-carrying API requests.
- Enforces endpoint-specific payload limits (login/users/default).
- Rejects disallowed or oversized requests before they reach feature handlers.

**Status codes:**

| Condition | HTTP |
|---|---|
| Method not allowed | `405` |
| Invalid content type | `400` |
| Payload too large | `413` |

### `rateLimiter.js`

Layered throttling middleware and helper functions.

**Exports:**

- `ipRateLimiter` — global per-IP request throttling.
- `loginRateLimiter` — login endpoint throttling per `ip + username/email` key.
- `userRateLimiter` — post-auth throttling per authenticated `userId`.
- `recordLoginFailure` / `clearLoginFailures` — called by auth service for brute-force controls.

**Behaviour:**

- Adds retry windows and throws `AppError(429, ...)` with `retryAfter` metadata.
- Supports temporary IP blocking after severe repeated violations.

### `authenticate.js`

JWT Bearer token verification middleware. Applied at the router level in `routes/index.js` to protect entire feature routers at once.

**Algorithm:**

1. Read `req.headers.authorization`.
2. If missing or does not start with `"Bearer "`, call `next(AppError(401, ...))`.
3. Extract the token string after `"Bearer "`.
4. Call `verifyAccessToken(token)` from `infrastructure/security/jwt.js`.
   - If the token is expired or invalid, `verifyAccessToken` throws `AppError(403, ...)` which is forwarded to the error handler.
5. On success, attach normalized auth context and call `next()`:

```js
req.auth = { userId, username, sessionId, jti, exp }
```

**Status codes:**

| Condition | HTTP |
|---|---|
| Missing or malformed `Authorization` header | `401` |
| Token invalid, expired, or unacceptable | `403` |

### `csrfProtection.js`

CSRF token lifecycle middleware for state-changing protected requests.

**Exports:**

- `csrfProtection` — validates and rotates CSRF tokens on mutating operations.
- `generateCsrfToken(sessionId)` — utility used by the auth service on login/refresh.

**Algorithm:**

1. Runs only for `POST`, `PATCH`, `DELETE`.
2. Skips auth bootstrap routes (`/auth/login`, `/auth/refresh`).
3. Requires `x-session-id` and `x-csrf-token` headers.
4. Validates one-time CSRF token against server store.
5. Rejects invalid/missing token with `400`/`403`.
6. Rotates CSRF token and returns next token in response header.

### `errorHandler.js`

Centralized error handler. Registered **last** in `app.js` after all routes and must keep its four-parameter signature `(err, req, res, next)` so Express recognises it as an error handler.

**Behaviour:**

- If `err` includes `retryAfter`, sets `Retry-After` response header.
- If `err` is an operational `AppError`:
  - In **production**: returns obfuscated, stable error payloads.
  - In **development**: returns structured error details including internal code and timestamp.
- For all other errors (programming errors, unexpected exceptions):
  - Logs the full error to the console.
  - In **production** (`NODE_ENV=production`): responds with `500` and a generic message — no stack traces are leaked.
  - In **development**: responds with `500` and includes `err.message` and `err.stack` for debugging.

### `notFound.js`

Catch-all handler registered after all routes in `app.js`.

- In **production**: returns a generic `Resource not found.` message to reduce endpoint discovery leakage.
- In **development**: includes method/path detail for debugging.

### `validate.js`

Factory function that creates a request body validation middleware from a Joi schema.

**Usage:**

```js
router.post('/login', validate(loginSchema), controller.login);
```

**Behaviour:**

- Calls `schema.validate(req.body, { abortEarly: false })`.
- On failure, collects all Joi error messages into a single `; `-delimited string and throws `AppError(400, message)`.
- On success, replaces `req.body` with the sanitised Joi output value and calls `next()`.
