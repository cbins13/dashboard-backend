# src/infrastructure/security/

Security infrastructure primitives for token cryptography, token lifecycle state, password hashing, and device/session integrity.

## Files

### `jwt.js`

JWT token creation and verification helpers.

**`createAccessToken(payload)`**

- Signs access payload with `ACCESS_TOKEN_SECRET` using HS256.
- Sets `expiresIn` from `ACCESS_TOKEN_EXPIRES_IN`.
- Adds issuer/audience/jti claims.
- Returns the signed token string.

**`createRefreshToken(payload)`**

- Signs refresh payload with `REFRESH_TOKEN_SECRET` (or fallback secret).
- Sets `expiresIn` from `REFRESH_TOKEN_EXPIRES_IN`.
- Adds issuer/audience/jti claims.

Typical access payload shape:

```js
{ userId: 1, username: 'alice', sessionId: '...', familyId: '...' }
```

**`verifyAccessToken(token)`**

- Verifies signature plus issuer/audience/algorithm constraints.
- Checks access token revocation list by `jti`.
- Throws operational `AppError(403, ...)` for expired, revoked, or invalid tokens.

**`verifyRefreshToken(token)`**

- Verifies refresh token signature and claims.
- Throws operational `AppError(403, ...)` for expired or invalid refresh tokens.

---

### `tokenManagement.js`

Refresh token family and revocation state management.

**Responsibilities:**

- Creates refresh token family state on login (`createRefreshFamily`).
- Rotates refresh token lineage on refresh (`rotateRefreshToken`).
- Detects replay/reuse when a consumed token is presented again.
- Revokes entire families on suspicious activity (`revokeRefreshFamily`).
- Maintains access-token revocation map by `jti` (`revokeAccessTokenJti`, `isAccessTokenRevoked`).

This module is the server-side backbone for refresh token reuse detection.

---

### `deviceBinding.js`

Session/device fingerprint helpers.

**Responsibilities:**

- Builds normalized fingerprint parts from request headers and IP.
- Produces deterministic fingerprint hashes for storage/comparison.
- Computes weighted similarity score for anomaly decisions.

Used by the auth refresh flow to identify suspicious device changes.

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
