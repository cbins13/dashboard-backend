'use strict';

const { Router } = require('express');
const authController = require('./auth.controller');
const validate = require('../../middleware/validate');
const { loginSchema } = require('./auth.validator');

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);

module.exports = router;
