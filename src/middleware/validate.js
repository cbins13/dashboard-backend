'use strict';

const AppError = require('../common/errors/AppError');

const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        const message = error.details.map((d) => d.message).join('; ');
        return next(new AppError(400, message));
    }

    req.body = value;
    next();
};

module.exports = validate;
