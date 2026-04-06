'use strict';

const Joi = require('joi');

const VALID_CTRL_VALUES = ['VIEW', 'CREATE', 'EDIT', 'DELETE'];

/** Normalize a comma-separated ctrl string: deduplicate, sort, validate individual tokens. */
const ctrlField = Joi.string()
    .trim()
    .custom((value, helpers) => {
        const parts = [...new Set(value.split(',').map((p) => p.trim().toUpperCase()))].filter(Boolean);

        if (parts.length === 0) {
            return helpers.error('any.invalid');
        }

        for (const part of parts) {
            if (!VALID_CTRL_VALUES.includes(part)) {
                return helpers.error('any.invalid');
            }
        }

        return parts.sort().join(',');
    })
    .messages({ 'any.invalid': 'ctrl must be a comma-separated list of VIEW, CREATE, EDIT, DELETE.' });

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
    ctrl: ctrlField.default('VIEW'),
});

const syncModulesSchema = Joi.object({
    modules: Joi.array()
        .items(
            Joi.object({
                moduleId: Joi.number().integer().positive().required(),
                ctrl: ctrlField.required(),
            })
        )
        .required(),
});

module.exports = { createRoleSchema, updateRoleSchema, assignModuleSchema, syncModulesSchema };