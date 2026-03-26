'use strict';

const { Router } = require('express');
const authController = require('./auth.controller');
const validate = require('../../middleware/validate');
const { loginSchema, refreshSchema, logoutSchema } = require('./auth.validator');
const { loginRateLimiter } = require('../../middleware/rateLimiter');

const router = Router();

router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);

module.exports = router;
