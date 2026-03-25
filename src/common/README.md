# src/common/

Shared utilities used across the entire application.

## Subdirectories and Files

### `asyncHandler.js`

Eliminates boilerplate `try/catch` blocks in async controller functions.

**Usage:**

```js
const asyncHandler = require('../common/asyncHandler');

const myHandler = asyncHandler(async (req, res) => {
    const data = await someAsyncOperation();
    res.json(data);
});
```

Wraps any async route handler so that a rejected promise is automatically forwarded to `next(err)`, reaching the centralized error handler without any additional code in the controller.

---

### `errors/AppError.js`

Custom error class that extends `Error`. Used throughout the application to represent expected, operational errors (invalid input, not found, unauthorized, etc.).

**Constructor:** `new AppError(statusCode, message)`

**Properties:**

| Property | Value |
|---|---|
| `statusCode` | HTTP status code (e.g. `400`, `401`, `403`, `404`) |
| `message` | Human-readable error message |
| `isOperational` | Always `true` — signals to `errorHandler.js` that this is a known error |

**Example:**

```js
throw new AppError(404, 'User not found.');
throw new AppError(401, 'Invalid credentials.');
throw new AppError(403, 'Token expired.');
```

---

### `http/response.js`

Standardized JSON response helpers to keep controllers consistent.

**`success(res, data, statusCode = 200)`**

Sends a successful JSON response:

```json
{ "success": true, "data": { ... } }
```

**`fail(res, message, statusCode = 400)`**

Sends a failure JSON response:

```json
{ "success": false, "message": "..." }
```

> Note: Controllers should use `success()` for happy-path responses. Error responses should go through `next(err)` and be handled by `errorHandler.js`, not by calling `fail()` directly.
