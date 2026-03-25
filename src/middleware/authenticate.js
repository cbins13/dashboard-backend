'use strict';

const AppError = require('../common/errors/AppError');
const { verifyAccessToken } = require('../infrastructure/security/jwt');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return next(new AppError(401, 'Authorization header is required.'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verifyAccessToken(token);
        req.auth = { userId: decoded.userId, username: decoded.username };
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = authenticate;
