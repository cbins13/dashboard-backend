'use strict';

const Joi = require('joi');

const createPersonSchema = Joi.object({
    name: Joi.string().trim().min(1).max(255).required(),
    age: Joi.number().integer().min(0).max(200).allow(null),
    height: Joi.number().precision(2).min(0).max(999.99).allow(null),
});

const updatePersonSchema = Joi.object({
    name: Joi.string().trim().min(1).max(255),
    age: Joi.number().integer().min(0).max(200).allow(null),
    height: Joi.number().precision(2).min(0).max(999.99).allow(null),
})
    .min(1)
    .messages({
        'object.min': 'At least one field must be provided.',
    });

module.exports = { createPersonSchema, updatePersonSchema };
