'use strict';

const Joi = require('joi');

const createRoleSchema = Joi.object({
    code: Joi.string().trim().min(1).max(100).required(),
    name: Joi.string().trim().min(1).max(255).required(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
});

const updateRoleSchema = Joi.object({
    name: Joi.string().trim().min(1).max(255),
    status: Joi.string().valid('ACTIVE', 'INACTIVE'),
})
    .min(1)
    .messages({
        'object.min': 'At least one field must be provided.',
    });

const assignModuleSchema = Joi.object({
    moduleId: Joi.number().integer().positive().required(),
    ctrl: Joi.string().valid('VIEW', 'CREATE', 'EDIT', 'DELETE').default('VIEW'),
});

module.exports = { createRoleSchema, updateRoleSchema, assignModuleSchema };