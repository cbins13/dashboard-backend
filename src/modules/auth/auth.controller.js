'use strict';

const asyncHandler = require('../../common/asyncHandler');
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

    const result = await authService.refresh(refreshToken, req, req.app.locals.db.sequelize);
    const { refreshToken: nextRefreshToken, ...responseData } = result;
    res.cookie('refreshToken', nextRefreshToken, REFRESH_COOKIE_OPTIONS);
    success(res, responseData, 200);
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
