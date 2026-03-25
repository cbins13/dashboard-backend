# src/middleware/

Reusable Express middleware. Each file exports a single middleware function or factory.

## Files

### `authenticate.js`

JWT Bearer token verification middleware. Applied at the router level in `routes/index.js` to protect entire feature routers at once.

**Algorithm:**

1. Read `req.headers.authorization`.
2. If missing or does not start with `"Bearer "`, call `next(AppError(401, ...))`.
3. Extract the token string after `"Bearer "`.
4. Call `verifyAccessToken(token)` from `infrastructure/security/jwt.js`.
   - If the token is expired or invalid, `verifyAccessToken` throws `AppError(403, ...)` which is forwarded to the error handler.
5. On success, attach `req.auth = { userId, username }` and call `next()`.

**Status codes:**

| Condition | HTTP |
|---|---|
| Missing or malformed `Authorization` header | `401` |
| Token invalid, expired, or unacceptable | `403` |

### `errorHandler.js`

Centralized error handler. Registered **last** in `app.js` after all routes and must keep its four-parameter signature `(err, req, res, next)` so Express recognises it as an error handler.

**Behaviour:**

- If `err` is an `AppError` with `isOperational = true`, responds with `err.statusCode` and `{ success: false, message: err.message }`.
- For all other errors (programming errors, unexpected exceptions):
  - Logs the full error to the console.
  - In **production** (`NODE_ENV=production`): responds with `500` and a generic message — no stack traces are leaked.
  - In **development**: responds with `500` and includes `err.message` and `err.stack` for debugging.

### `notFound.js`

Catch-all handler registered after all routes in `app.js`. Throws `AppError(404, ...)` for any request that did not match a defined route, which the error handler then converts to a JSON 404 response.

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
