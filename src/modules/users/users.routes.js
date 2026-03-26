'use strict';

const { Router } = require('express');
const usersController = require('./users.controller');
const { requireAccess } = require('../../middleware/authorizeAccess');
const validate = require('../../middleware/validate');
const { createUserSchema, updateUserSchema } = require('./users.validator');

const router = Router();

// authenticate is NOT applied here — it is applied at the mount point in src/routes/index.js
// so the protection boundary is visible in one place.
router.get('/', requireAccess('USER_MANAGEMENT', 'VIEW'), usersController.getUsers);
router.get('/:userId', requireAccess('USER_MANAGEMENT', 'VIEW'), usersController.getUser);
router.post('/', requireAccess('USER_MANAGEMENT', 'CREATE'), validate(createUserSchema), usersController.createUser);
router.patch('/:userId', requireAccess('USER_MANAGEMENT', 'UPDATE'), validate(updateUserSchema), usersController.updateUser);
router.delete('/:userId', requireAccess('USER_MANAGEMENT', 'DELETE'), usersController.deleteUser);

module.exports = router;
