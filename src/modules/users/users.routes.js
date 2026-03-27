'use strict';

const { Router } = require('express');
const usersController = require('./users.controller');
const { requireAccessCategory } = require('../../middleware/authorizeAccess');
const validate = require('../../middleware/validate');
const { createUserSchema, updateUserSchema } = require('./users.validator');

const router = Router();

// authenticate is NOT applied here — it is applied at the mount point in src/routes/index.js
// so the protection boundary is visible in one place.
router.get('/', requireAccessCategory('USER_MANAGEMENT'), usersController.getUsers);
router.get('/:userId', requireAccessCategory('USER_MANAGEMENT'), usersController.getUser);
router.post('/', requireAccessCategory('USER_MANAGEMENT'), validate(createUserSchema), usersController.createUser);
router.patch('/:userId', requireAccessCategory('USER_MANAGEMENT'), validate(updateUserSchema), usersController.updateUser);
router.delete('/:userId', requireAccessCategory('USER_MANAGEMENT'), usersController.deleteUser);

module.exports = router;
