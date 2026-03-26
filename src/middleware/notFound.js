'use strict';

const AppError = require('../common/errors/AppError');
const config = require('../config/env');

const notFound = (req, res, next) => {
    if (config.nodeEnv === 'production') {
        return next(new AppError(404, 'Resource not found.'));
    }

    return next(new AppError(404, `Route ${req.method} ${req.url} not found.`));
};

module.exports = notFound;
