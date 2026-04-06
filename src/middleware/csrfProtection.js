'use strict';

const crypto = require('node:crypto');
const AppError = require('../common/errors/AppError');
const { securityPolicy } = require('../config/security');

const csrfStore = new Map();

const generateCsrfToken = (sessionId) => {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + securityPolicy.token.csrfTtlMs;

    csrfStore.set(sessionId, { token, expiresAt });
    return token;
};

const consumeCsrfToken = (sessionId, providedToken) => {
    const entry = csrfStore.get(sessionId);

    if (!entry || entry.expiresAt < Date.now()) {
        csrfStore.delete(sessionId);
        return false;
    }

    if (entry.token !== providedToken) {
        return false;
    }

    csrfStore.delete(sessionId);
    return true;
};

const csrfProtection = (req, res, next) => {
    try {
        const mutating = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

        if (!mutating.has(req.method)) {
            return next();
        }

        if (req.path.startsWith('/auth/login') || req.path.startsWith('/auth/refresh')) {
            return next();
        }

        const sessionId = req.headers['x-session-id'];
        const csrfToken = req.headers['x-csrf-token'];

        if (!sessionId || !csrfToken) {
            throw new AppError(400, 'Missing CSRF token or session context.');
        }

        if (!consumeCsrfToken(String(sessionId), String(csrfToken))) {
            throw new AppError(403, 'Invalid CSRF token.');
        }

        res.setHeader('x-csrf-token', generateCsrfToken(String(sessionId)));
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { csrfProtection, generateCsrfToken };
