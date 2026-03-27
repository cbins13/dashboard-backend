'use strict';

const { Router } = require('express');
const rolesController = require('./roles.controller');
const validate = require('../../middleware/validate');
const { requireAccessCategory } = require('../../middleware/authorizeAccess');
const {
    createRoleSchema,
    updateRoleSchema,
    assignModuleSchema,
} = require('./roles.validator');

const router = Router();

router.get('/', requireAccessCategory('USER_MANAGEMENT'), rolesController.getRoles);
router.get('/:roleId', requireAccessCategory('USER_MANAGEMENT'), rolesController.getRole);
router.post(
    '/',
    requireAccessCategory('USER_MANAGEMENT'),
    validate(createRoleSchema),
    rolesController.createRole
);
router.patch(
    '/:roleId',
    requireAccessCategory('USER_MANAGEMENT'),
    validate(updateRoleSchema),
    rolesController.updateRole
);
router.delete('/:roleId', requireAccessCategory('USER_MANAGEMENT'), rolesController.deleteRole);
router.post(
    '/:roleId/modules',
    requireAccessCategory('USER_MANAGEMENT'),
    validate(assignModuleSchema),
    rolesController.assignModule
);
router.delete(
    '/:roleId/modules/:moduleId',
    requireAccessCategory('USER_MANAGEMENT'),
    rolesController.revokeModule
);

module.exports = router;