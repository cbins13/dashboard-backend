'use strict';

const { Router } = require('express');
const authController = require('./auth.controller');
const authenticate = require('../../middleware/authenticate');
const validate = require('../../middleware/validate');
const { loginSchema, refreshSchema, logoutSchema } = require('./auth.validator');
const { loginRateLimiter } = require('../../middleware/rateLimiter');

const router = Router();

router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);
// No body validation needed for refresh — refreshToken arrives via httpOnly cookie.
router.post('/refresh', authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
