# src/infrastructure/security/

Cryptographic primitives for JWT token operations and password hashing. These are the **only files** in the codebase that import `jsonwebtoken` or `bcrypt`. All other code calls these utility functions instead of the libraries directly.

## Files

### `jwt.js`

JWT access token creation and verification.

**`createAccessToken(payload)`**

- Signs `payload` with `ACCESS_TOKEN_SECRET` using the HS256 algorithm.
- Sets `expiresIn` from `ACCESS_TOKEN_EXPIRES_IN` (default `15m`).
- Returns the signed token string.

Typical payload shape:

```js
{ userId: 1, username: 'alice' }
```

**`verifyAccessToken(token)`**

- Calls `jwt.verify(token, secret)` and returns the decoded payload.
- If the token has **expired** (`TokenExpiredError`), throws `AppError(403, 'Token expired.')`.
- If the token is **invalid** for any other reason (`JsonWebTokenError`), throws `AppError(403, 'Token invalid or unacceptable.')`.
- The 403 (Forbidden) status is used — not 401 — because the token was presented but cannot be accepted.

---

### `password.js`

bcrypt password hashing and verification.

**`hashPassword(plain)`**

- Calls `bcrypt.hash(plain, 12)` with a work factor of 12.
- Returns a Promise that resolves to the bcrypt hash string.
- Used in `users.service.js` before storing a new or updated user password.

**`verifyPassword(plain, hash)`**

- Calls `bcrypt.compare(plain, hash)`.
- Returns a Promise that resolves to `true` (match) or `false` (mismatch).
- Used in `auth.service.js` during login. On mismatch, the service throws the same `AppError(401, 'Invalid credentials.')` as a not-found result to prevent username enumeration.
