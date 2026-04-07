'use strict';

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const { csrfProtection } = require('../middleware/csrfProtection');
const { userRateLimiter } = require('../middleware/rateLimiter');
const authRouter = require('../modules/auth/auth.routes');
const usersRouter = require('../modules/users/users.routes');
const rolesRouter = require('../modules/roles/roles.routes');
const moduleCatalogRouter = require('../modules/modules/modules.routes');
const personsRouter = require('../modules/persons/persons.routes');

const router = Router();

// Public routes
router.use('/auth', authRouter);

// Protected routes — authenticate is applied here so the boundary is
// visible to any reader scanning this file. The users router itself
// is auth-agnostic and can be tested independently.
router.use('/users', authenticate, userRateLimiter, csrfProtection, usersRouter);
router.use('/roles', authenticate, userRateLimiter, csrfProtection, rolesRouter);
router.use('/modules', authenticate, userRateLimiter, csrfProtection, moduleCatalogRouter);
router.use('/persons', authenticate, userRateLimiter, csrfProtection, personsRouter);

module.exports = router;
