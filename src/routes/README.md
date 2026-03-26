# src/routes/

Root API router. This is the **single mount point** for all versioned feature routers.

## Files

### `index.js`

Creates one `express.Router()` and mounts feature routers onto it. `app.js` mounts this router at `/api/v1`, so all routes defined here are automatically prefixed with `/api/v1`.

#### Route table

| Prefix | Router | Auth middleware applied here |
|---|---|---|
| `/auth` | `modules/auth/auth.routes.js` | None (public) |
| `/users` | `modules/users/users.routes.js` | `authenticate`, `userRateLimiter`, `csrfProtection` |

#### Why authenticate is applied here and not inside the users router

The `authenticate` middleware is added at the mount point:

```js
router.use('/users', authenticate, userRateLimiter, csrfProtection, usersRouter);
```

This keeps the `users.routes.js` file stateless about authentication and protection policy.

Any reader scanning `routes/index.js` can see the full protection boundary in one place:

- JWT authentication
- user-level request throttling
- CSRF validation/rotation for mutating operations

The users router can be tested independently without directly coupling route definitions to security middleware implementation details.

#### Adding new feature modules

Mount additional feature routers here. Public routers go above the `authenticate` line; protected routers add `authenticate` as an argument before the router reference. Do not mount routes in `app.js` or anywhere else.
