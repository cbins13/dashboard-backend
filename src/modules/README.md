# src/modules/

Feature modules. Each module owns its full vertical slice: router → controller → service → repository → validator. Modules do not import from each other except where identity lookup is explicitly required.

## Modules

| Module | Description |
|---|---|
| [`auth/`](auth/README.md) | Login, refresh-token rotation, logout-family revocation |
| [`users/`](users/README.md) | User CRUD (protected by JWT) |

## Conventions

**Layering:**

```
router  →  controller  →  service  →  repository
```

| Layer | Responsibility |
|---|---|
| Router | Define route paths, apply validation and auth middleware |
| Controller | Read from `req`, call service, write to `res` — no business logic |
| Service | Business rules, throws `AppError` for domain failures |
| Repository | All database queries — no business rules, no transport logic |
| Validator | Joi schemas for request body validation |

**Database access:**

Repositories receive `sequelize` as a parameter, injected from the controller via the service:

```
req.app.locals.db.sequelize  →  controller  →  service  →  repository
```

This keeps modules testable in isolation and avoids circular imports through `app.locals`.

**Adding a new module:**

1. Create a new directory under `src/modules/<name>/`.
2. Create the five standard files: `.routes.js`, `.controller.js`, `.service.js`, `.repository.js`, `.validator.js`.
3. Register the router in `src/routes/index.js` — nowhere else.
