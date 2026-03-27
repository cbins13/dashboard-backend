'use strict';

const AppError = require('../common/errors/AppError');
const { securityPolicy } = require('../config/security');

const ipBuckets = new Map();
const userBuckets = new Map();
const loginBuckets = new Map();
const blockedIps = new Map();

const now = () => Date.now();

const readBucket = (store, key, windowMs) => {
    const current = store.get(key);
    const timestamp = now();

    if (!current || timestamp > current.resetAt) {
        const fresh = { count: 0, resetAt: timestamp + windowMs };
        store.set(key, fresh);
        return fresh;
    }

    return current;
};

const isBlockedIp = (ip) => {
    const expiresAt = blockedIps.get(ip);

    if (!expiresAt) return false;
    if (now() > expiresAt) {
        blockedIps.delete(ip);
        return false;
    }

    return true;
};

const escalateIpBlock = (ip) => {
    const blockUntil = now() + securityPolicy.rateLimit.blockWindowMs;
    blockedIps.set(ip, blockUntil);
};

const failWithRetryAfter = (bucket, message = 'Too many requests.') => {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now()) / 1000));
    const error = new AppError(429, message);
    error.retryAfter = retryAfterSeconds;
    throw error;
};

const ipRateLimiter = (req, res, next) => {
    try {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';

        if (isBlockedIp(ip)) {
            throw new AppError(429, 'Too many requests. Please try again later.');
        }

        const bucket = readBucket(ipBuckets, ip, 60 * 1000);
        bucket.count += 1;

        if (bucket.count > securityPolicy.rateLimit.publicPerMinute) {
            failWithRetryAfter(bucket);
        }

        next();
    } catch (error) {
        next(error);
    }
};

const loginRateLimiter = (req, res, next) => {
    try {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const username = (req.body && (req.body.username || req.body.email)) || 'anonymous';
        const key = `${ip}:${username}`;

        // Temporarily disabled: allow login attempts without per-identity throttling.
        req.rateLimitContext = { ip, key };
        next();
    } catch (error) {
        next(error);
    }
};

const recordLoginFailure = () => {};

const clearLoginFailures = () => {};

const userRateLimiter = (req, res, next) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            throw new AppError(401, 'Unauthorized.');
        }

        const key = String(userId);
        const bucket = readBucket(userBuckets, key, 60 * 1000);
        bucket.count += 1;

        if (bucket.count > securityPolicy.rateLimit.protectedPerMinute) {
            failWithRetryAfter(bucket);
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    ipRateLimiter,
    loginRateLimiter,
    userRateLimiter,
    recordLoginFailure,
    clearLoginFailures,
};
