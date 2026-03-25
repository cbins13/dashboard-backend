'use strict';

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authRouter = require('../modules/auth/auth.routes');
const usersRouter = require('../modules/users/users.routes');

const router = Router();

// Public routes
router.use('/auth', authRouter);

// Protected routes — authenticate is applied here so the boundary is
// visible to any reader scanning this file. The users router itself
// is auth-agnostic and can be tested independently.
router.use('/users', authenticate, usersRouter);

module.exports = router;
