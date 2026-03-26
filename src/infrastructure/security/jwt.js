'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const config = require('../../config/env');
const { securityPolicy } = require('../../config/security');
const AppError = require('../../common/errors/AppError');
const { isAccessTokenRevoked } = require('./tokenManagement');

const BASE_VERIFY_OPTIONS = {
    algorithms: ['HS256'],
    issuer: securityPolicy.token.issuer,
    audience: securityPolicy.token.audience,
};

const createAccessToken = (payload) =>
    jwt.sign(payload, config.jwtAccessSecret, {
        expiresIn: config.jwtAccessExpiresIn,
        issuer: securityPolicy.token.issuer,
        audience: securityPolicy.token.audience,
        jwtid: crypto.randomUUID(),
    });

const createRefreshToken = (payload) =>
    jwt.sign(payload, config.jwtRefreshSecret, {
        expiresIn: config.jwtRefreshExpiresIn,
        issuer: securityPolicy.token.issuer,
        audience: securityPolicy.token.audience,
        jwtid: crypto.randomUUID(),
    });

const verifyAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, config.jwtAccessSecret, BASE_VERIFY_OPTIONS);

        if (decoded.jti && isAccessTokenRevoked(decoded.jti)) {
            throw new AppError(403, 'Token revoked.');
        }

        return decoded;
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            throw new AppError(403, 'Token expired.');
        }

        if (err instanceof AppError) {
            throw err;
        }

        throw new AppError(403, 'Token invalid or unacceptable.');
    }
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, config.jwtRefreshSecret, BASE_VERIFY_OPTIONS);
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            throw new AppError(403, 'Refresh token expired.');
        }

        throw new AppError(403, 'Refresh token invalid or unacceptable.');
    }
};

module.exports = { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken };
