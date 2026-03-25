'use strict';

const config = require('../config/env');
const AppError = require('../common/errors/AppError');

// Four-parameter signature is required for Express to recognise this as an error handler.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    if (err instanceof AppError && err.isOperational) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }

    console.error('[Unhandled Error]', err);

    if (config.nodeEnv === 'production') {
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }

    return res.status(500).json({
        success: false,
        message: err.message,
        stack: err.stack,
    });
};

module.exports = errorHandler;
