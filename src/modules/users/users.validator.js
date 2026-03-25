'use strict';

const Joi = require('joi');

const createUserSchema = Joi.object({
    username: Joi.string().trim().min(1).max(100).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(8).required(),
});

const updateUserSchema = Joi.object({
    username: Joi.string().trim().min(1).max(100),
    email: Joi.string().trim().email(),
    password: Joi.string().min(8),
})
    .min(1)
    .messages({
        'object.min': 'At least one field must be provided.',
    });

module.exports = { createUserSchema, updateUserSchema };
