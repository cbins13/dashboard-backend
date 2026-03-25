'use strict';

const { Router } = require('express');
const usersController = require('./users.controller');
const validate = require('../../middleware/validate');
const { createUserSchema, updateUserSchema } = require('./users.validator');

const router = Router();

// authenticate is NOT applied here — it is applied at the mount point in src/routes/index.js
// so the protection boundary is visible in one place.
router.get('/', usersController.getUsers);
router.post('/', validate(createUserSchema), usersController.createUser);
router.patch('/:userId', validate(updateUserSchema), usersController.updateUser);
router.delete('/:userId', usersController.deleteUser);

module.exports = router;
