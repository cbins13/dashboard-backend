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

// refreshToken is now read from the httpOnly cookie; no body fields are required.
const refreshSchema = Joi.object({});

// refreshToken is now read from the httpOnly cookie; only familyId is needed in the body.
const logoutSchema = Joi.object({
    familyId: Joi.string().required(),
});

module.exports = { loginSchema, refreshSchema, logoutSchema };
