'use strict';

const jwt = require('jsonwebtoken');
const config = require('../../config/env');
const AppError = require('../../common/errors/AppError');

const createAccessToken = (payload) =>
    jwt.sign(payload, config.jwtAccessSecret, { expiresIn: config.jwtAccessExpiresIn });

const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, config.jwtAccessSecret);
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            throw new AppError(403, 'Token expired.');
        }

        throw new AppError(403, 'Token invalid or unacceptable.');
    }
};

module.exports = { createAccessToken, verifyAccessToken };
