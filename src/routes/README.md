# src/routes/

Root API router. This is the **single mount point** for all versioned feature routers.

## Files

### `index.js`

Creates one `express.Router()` and mounts feature routers onto it. `app.js` mounts this router at `/api/v1`, so all routes defined here are automatically prefixed with `/api/v1`.

#### Route table

| Prefix | Router | Auth middleware applied here |
|---|---|---|
| `/auth` | `modules/auth/auth.routes.js` | None (public) |
| `/users` | `modules/users/users.routes.js` | `authenticate` |

#### Why authenticate is applied here and not inside the users router

The `authenticate` middleware is added at the mount point:

```js
router.use('/users', authenticate, usersRouter);
```

This keeps the `users.routes.js` file stateless about authentication. Any reader scanning `routes/index.js` can see the full protection boundary in one place. The users router can be tested independently without needing to provide a JWT.

#### Adding new feature modules

Mount additional feature routers here. Public routers go above the `authenticate` line; protected routers add `authenticate` as an argument before the router reference. Do not mount routes in `app.js` or anywhere else.
