'use strict';

const Joi = require('joi');

const createModuleSchema = Joi.object({
    code: Joi.string().trim().min(1).max(100).required(),
    name: Joi.string().trim().min(1).max(255).required(),
    route: Joi.string().trim().allow(null, '').max(255).default(null),
});

const updateModuleSchema = Joi.object({
    name: Joi.string().trim().min(1).max(255),
    route: Joi.string().trim().allow(null, '').max(255),
    status: Joi.string().valid('ACTIVE', 'INACTIVE'),
})
    .min(1)
    .messages({
        'object.min': 'At least one field must be provided.',
    });

const createCategorySchema = Joi.object({
    code: Joi.string().trim().min(1).max(100).required(),
    name: Joi.string().trim().min(1).max(255).required(),
    sortOrder: Joi.number().integer().min(1).default(1),
    status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
});

const updateCategorySchema = Joi.object({
    name: Joi.string().trim().min(1).max(255),
    sortOrder: Joi.number().integer().min(1),
    status: Joi.string().valid('ACTIVE', 'INACTIVE'),
})
    .min(1)
    .messages({
        'object.min': 'At least one field must be provided.',
    });

module.exports = { createModuleSchema, updateModuleSchema, createCategorySchema, updateCategorySchema };