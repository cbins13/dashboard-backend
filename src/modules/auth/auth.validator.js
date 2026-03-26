'use strict';

const Joi = require('joi');

const loginSchema = Joi.object({
    username: Joi.string().trim().min(1),
    email: Joi.string().trim().email(),
    password: Joi.string().required().messages({
        'any.required': 'password is required.',
        'string.empty': 'password must not be empty.',
    }),
})
    .or('username', 'email')
    .messages({
        'object.missing': 'Either username or email is required.',
    });

const refreshSchema = Joi.object({
    refreshToken: Joi.string().required(),
    sessionId: Joi.string().required(),
});

const logoutSchema = Joi.object({
    refreshToken: Joi.string().required(),
    familyId: Joi.string().required(),
});

module.exports = { loginSchema, refreshSchema, logoutSchema };
