'use strict';

const { Router } = require('express');
const validate = require('../../middleware/validate');
const { requireAccessCategory } = require('../../middleware/authorizeAccess');
const modulesController = require('./modules.controller');
const { createModuleSchema, updateModuleSchema } = require('./modules.validator');

const router = Router();

router.get('/', requireAccessCategory('USER_MANAGEMENT'), modulesController.getCategories);
router.get('/:categoryId', requireAccessCategory('USER_MANAGEMENT'), modulesController.getCategory);
router.post(
    '/:categoryId/modules',
    requireAccessCategory('USER_MANAGEMENT'),
    validate(createModuleSchema),
    modulesController.createModule
);
router.patch(
    '/module/:moduleId',
    requireAccessCategory('USER_MANAGEMENT'),
    validate(updateModuleSchema),
    modulesController.updateModule
);
router.delete('/module/:moduleId', requireAccessCategory('USER_MANAGEMENT'), modulesController.deleteModule);

module.exports = router;