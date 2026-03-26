'use strict';

const helmetOptions = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
};

const securityPolicy = Object.freeze({
    token: Object.freeze({
        accessTokenTtl: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
        refreshTokenTtl: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
        issuer: process.env.JWT_ISSUER || 'dashboard-backend',
        audience: process.env.JWT_AUDIENCE || 'dashboard-api',
        csrfTtlMs: 24 * 60 * 60 * 1000,
    }),
    payloadLimits: Object.freeze({
        loginBytes: 1024,
        userCrudBytes: 10 * 1024,
        defaultBytes: 100 * 1024,
    }),
    rateLimit: Object.freeze({
        publicPerMinute: 100,
        loginAttemptsPer15Min: 5,
        protectedPerMinute: 1000,
        ipHardBlockViolationsPerHour: 50,
        blockWindowMs: 60 * 60 * 1000,
        loginWindowMs: 15 * 60 * 1000,
    }),
    deviceBinding: Object.freeze({
        suspiciousThreshold: 70,
        hijackThreshold: 50,
        weights: Object.freeze({
            userAgent: 40,
            ip: 40,
            acceptLanguage: 10,
            acceptEncoding: 10,
        }),
    }),
    password: Object.freeze({
        minLength: 8,
        maxLength: 255,
        requireUpper: true,
        requireLower: true,
        requireDigit: true,
        requireSpecial: true,
    }),
});

module.exports = { helmetOptions, securityPolicy };
