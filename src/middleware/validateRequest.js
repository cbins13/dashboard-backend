'use strict';

const AppError = require('../common/errors/AppError');
const { securityPolicy } = require('../config/security');

const parseContentLength = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
};

const resolvePayloadLimit = (req) => {
    const path = req.path || '';

    if (path.endsWith('/auth/login') || path.includes('/auth/login')) {
        return securityPolicy.payloadLimits.loginBytes;
    }

    if (path.includes('/users')) {
        return securityPolicy.payloadLimits.userCrudBytes;
    }

    return securityPolicy.payloadLimits.defaultBytes;
};

const validateApiIngress = (req, res, next) => {
    try {
        const allowedMethods = new Set(['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']);

        if (!allowedMethods.has(req.method)) {
            throw new AppError(405, 'Method not allowed.');
        }

        // Let CORS middleware handle browser preflight requests.
        if (req.method === 'OPTIONS') {
            return next();
        }

        const contentLength = parseContentLength(req.headers['content-length']);
        const isChunked = typeof req.headers['transfer-encoding'] === 'string';
        const expectsJsonBody =
            req.method === 'POST' || req.method === 'PATCH' || req.method === 'DELETE';
        const hasBody = expectsJsonBody && (contentLength > 0 || isChunked);

        if (hasBody) {
            const contentType = req.headers['content-type'] || '';

            if (!contentType.toLowerCase().startsWith('application/json')) {
                throw new AppError(400, 'Invalid content type.');
            }
        }

        const maxBytes = resolvePayloadLimit(req);

        if (contentLength > maxBytes) {
            throw new AppError(413, 'Payload too large.');
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { validateApiIngress };
