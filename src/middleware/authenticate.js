'use strict';

const AppError = require('../common/errors/AppError');
const { verifyAccessToken } = require('../infrastructure/security/jwt');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next(new AppError(401, 'Unauthorized.'));
    }

    if (!authHeader.startsWith('Bearer ')) {
        return next(new AppError(401, 'Unauthorized.'));
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return next(new AppError(401, 'Unauthorized.'));
    }

    try {
        const decoded = verifyAccessToken(token);
        req.auth = {
            userId: decoded.userId,
            username: decoded.username,
            sessionId: decoded.sessionId,
            jti: decoded.jti,
            exp: decoded.exp,
        };
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = authenticate;
