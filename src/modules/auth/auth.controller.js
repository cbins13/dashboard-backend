'use strict';

const asyncHandler = require('../../common/asyncHandler');
const AppError = require('../../common/errors/AppError');
const { success } = require('../../common/http/response');
const authService = require('./auth.service');
const env = require('../../config/env');

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, req.app.locals.db.sequelize, req);
    const { refreshToken, ...responseData } = result;
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    success(res, responseData, 200);
});

const refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'No refresh token provided.' });
    }

    try {
        const result = await authService.refresh(refreshToken, req, req.app.locals.db.sequelize);
        const { refreshToken: nextRefreshToken, ...responseData } = result;
        res.cookie('refreshToken', nextRefreshToken, REFRESH_COOKIE_OPTIONS);
        success(res, responseData, 200);
    } catch (error) {
        const isRefreshFailure =
            error instanceof AppError &&
            error.statusCode === 403;

        if (!isRefreshFailure) {
            throw error;
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: env.nodeEnv === 'production',
            sameSite: 'strict',
            path: '/api/v1/auth',
        });

        return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'Session cookie is invalid. Please refresh the page and sign in again.',
            code: 'REFRESH_COOKIE_INVALID',
        });
    }
});

const me = asyncHandler(async (req, res) => {
    const profile = await authService.me(req.app.locals.db.sequelize, req.auth.userId);
    success(res, profile, 200);
});

const logout = asyncHandler(async (req, res) => {
    await authService.logout(req.body);
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth',
    });
    res.status(204).end();
});

module.exports = { login, refresh, logout, me };
