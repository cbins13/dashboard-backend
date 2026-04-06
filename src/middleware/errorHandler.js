'use strict';

const config = require('../config/env');
const AppError = require('../common/errors/AppError');

/**
 * Strip Oracle schema/user names from error messages so they are never
 * leaked to the client.  Patterns like  SCHEMA_OWNER.TABLE_NAME  or
 * (SCHEMA_OWNER.CONSTRAINT_NAME) are replaced with the object name only.
 */
const sanitizeOracleMessage = (message) => {
    if (typeof message !== 'string') return message;
    // Remove schema prefix in parenthetical references: (SCHEMA.CONSTRAINT) → (CONSTRAINT)
    // and in bare references: SCHEMA.TABLE → TABLE
    return message.replace(/\b[A-Za-z0-9_#$]+\.([A-Za-z0-9_#$]+)\b/g, '$1');
};

const resolveProdErrorName = (statusCode) => {
    if (statusCode === 401) return 'Unauthorized';
    return 'RequestFailed';
};

const resolveProdMessage = (statusCode, fallbackMessage) => {
    if (statusCode === 401) return 'Invalid credentials';
    if (statusCode === 403) return 'Access denied';
    if (statusCode === 404) return 'Resource not found';
    return fallbackMessage;
};

const buildOperationalPayload = (err) => {
    if (config.nodeEnv === 'production') {
        return {
            success: false,
            error: resolveProdErrorName(err.statusCode),
            message: resolveProdMessage(err.statusCode, err.message),
        };
    }

    return {
        success: false,
        error: err.name || 'AppError',
        message: sanitizeOracleMessage(err.message),
        code: `ERR_${err.statusCode}`,
        retryAfter: err.retryAfter,
        timestamp: new Date().toISOString(),
    };
};

// Four-parameter signature is required for Express to recognise this as an error handler.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    if (err?.retryAfter) {
        res.setHeader('Retry-After', String(err.retryAfter));
    }

    if (err instanceof AppError && err.isOperational) {
        return res.status(err.statusCode).json(buildOperationalPayload(err));
    }

    console.error('[Unhandled Error]', err);

    if (config.nodeEnv === 'production') {
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }

    return res.status(500).json({
        success: false,
        message: sanitizeOracleMessage(err.message),
        stack: sanitizeOracleMessage(err.stack),
    });
};

module.exports = errorHandler;
