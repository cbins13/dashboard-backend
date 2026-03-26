'use strict';

const Joi = require('joi');

const createUserSchema = Joi.object({
    username: Joi.string().trim().min(1).max(255).required(),
    password: Joi.string().min(8).required(),
    displayname: Joi.string().trim().min(1).max(255).required(),
    userstatus: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE'),
    archived: Joi.number().valid(0, 1).default(0),
});

const updateUserSchema = Joi.object({
    username: Joi.string().trim().min(1).max(255),
    password: Joi.string().min(8),
    displayname: Joi.string().trim().min(1).max(255),
    userstatus: Joi.string().valid('ACTIVE', 'INACTIVE'),
    archived: Joi.number().valid(0, 1),
})
    .min(1)
    .messages({
        'object.min': 'At least one field must be provided.',
    });

module.exports = { createUserSchema, updateUserSchema };
