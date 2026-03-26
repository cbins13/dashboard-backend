---
applyTo: "**/*.js"
description: "Use when generating or modifying backend code to keep README documentation updated using the repository's established format."
---

# Document Newly Generated Code

When you add or modify code, update the relevant documentation in the same change.

## Goal

Keep README files synchronized with newly generated code so docs always describe current behavior, routes, middleware, algorithms, and contracts.

## Documentation Scope Rules

1. Update the closest README first:
   - If file is in `src/modules/auth/`, update `src/modules/auth/README.md`.
   - If file is in `src/middleware/`, update `src/middleware/README.md`.
   - If file is in `src/infrastructure/security/`, update `src/infrastructure/security/README.md`.
2. If behavior affects routing/mount order, also update `src/routes/README.md` and `src/README.md`.
3. If public API contracts or env vars changed, also update root `README.md`.
4. If feature summary changed, update relevant parent README (e.g., `src/modules/README.md`, `src/infrastructure/README.md`).

## Required Format (match existing repo style)

1. Use title as folder path, e.g. `# src/modules/auth/`.
2. Use sections in this order when applicable:
   - `## Files`
   - `### <file>`
   - `## Routes`
   - `## Response Contracts`
   - `## Status codes`
3. Use concise bullets for behavior and algorithms.
4. Use markdown tables for route maps and status-code maps.
5. Keep examples short and copy-pastable.
6. Do not include speculative/future behavior unless explicitly labeled.

## Update Checklist

For each changed feature, document:

1. What was added/changed.
2. Middleware order or protection boundaries (if applicable).
3. New/changed endpoint methods and paths.
4. Validation requirements and required fields.
5. Token/session/rate-limit/CSRF/security behavior.
6. Error/status code outcomes.
7. Config/env/script changes required to run it.

## Accuracy Rules

1. Read current implementation files before editing docs.
2. Do not claim behavior that is not in code.
3. Keep terminology consistent with code symbols and filenames.
4. When security behavior differs by environment, document both dev and production behavior.

## Completion Rule

A feature change is not complete until documentation for that feature is updated in the relevant README files.
