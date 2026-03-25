'use strict';

const asyncHandler = require('../../common/asyncHandler');
const { success } = require('../../common/http/response');
const authService = require('./auth.service');

const login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body, req.app.locals.db.sequelize);
    success(res, result, 200);
});

const logout = asyncHandler(async (req, res) => {
    await authService.logout(req.auth);
    res.status(204).end();
});

module.exports = { login, logout };
