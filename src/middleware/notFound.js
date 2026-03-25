'use strict';

const AppError = require('../common/errors/AppError');

const notFound = (req, res, next) => {
    next(new AppError(404, `Route ${req.method} ${req.url} not found.`));
};

module.exports = notFound;
