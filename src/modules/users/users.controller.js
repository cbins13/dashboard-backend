'use strict';

const asyncHandler = require('../../common/asyncHandler');
const { success } = require('../../common/http/response');
const usersService = require('./users.service');

const getUsers = asyncHandler(async (req, res) => {
    const users = await usersService.getAll(req.app.locals.db.sequelize);
    success(res, users);
});

const getUser = asyncHandler(async (req, res) => {
    const user = await usersService.getById(req.app.locals.db.sequelize, req.params.userId);
    success(res, user);
});

const createUser = asyncHandler(async (req, res) => {
    const user = await usersService.create(req.app.locals.db.sequelize, req.body);
    success(res, user, 201);
});

const updateUser = asyncHandler(async (req, res) => {
    const user = await usersService.update(
        req.app.locals.db.sequelize,
        req.params.userId,
        req.body
    );
    success(res, user);
});

const deleteUser = asyncHandler(async (req, res) => {
    await usersService.remove(req.app.locals.db.sequelize, req.params.userId);
    res.status(204).end();
});

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
