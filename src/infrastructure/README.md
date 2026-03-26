# src/infrastructure/

Low-level integration layer. Contains Oracle/Sequelize database integration plus reusable security infrastructure (JWT, password hashing, refresh lifecycle state, and device binding utilities). No business logic lives here — these modules are utilities called by the module layer above.

## Subdirectories

| Directory | Description |
|---|---|
| [`db/`](db/README.md) | Oracle connection pool, Sequelize instance creation, schema utilities |
| [`security/`](security/README.md) | JWT access/refresh operations, token family management, device binding, bcrypt helpers |
