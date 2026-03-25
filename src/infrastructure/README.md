# src/infrastructure/

Low-level integration layer. Contains the Oracle/Sequelize database connection and the JWT/bcrypt security primitives. No business logic lives here — these modules are utilities called by the module layer above.

## Subdirectories

| Directory | Description |
|---|---|
| [`db/`](db/README.md) | Oracle connection pool, Sequelize instance creation, schema utilities |
| [`security/`](security/README.md) | JWT token operations and bcrypt password hashing |
