'use strict';

const asyncHandler = require('../../common/asyncHandler');
const { success } = require('../../common/http/response');
const rolesService = require('./roles.service');

const getRoles = asyncHandler(async (req, res) => {
    const roles = await rolesService.getAll(req.app.locals.db.sequelize);
    success(res, roles);
});

const getRole = asyncHandler(async (req, res) => {
    const role = await rolesService.getById(req.app.locals.db.sequelize, req.params.roleId);
    success(res, role);
});

const createRole = asyncHandler(async (req, res) => {
    const role = await rolesService.create(req.app.locals.db.sequelize, req.body);
    success(res, role, 201);
});

const updateRole = asyncHandler(async (req, res) => {
    const role = await rolesService.update(req.app.locals.db.sequelize, req.params.roleId, req.body);
    success(res, role);
});

const deleteRole = asyncHandler(async (req, res) => {
    await rolesService.remove(req.app.locals.db.sequelize, req.params.roleId);
    res.status(204).end();
});

const assignModule = asyncHandler(async (req, res) => {
    const role = await rolesService.assignModule(
        req.app.locals.db.sequelize,
        req.params.roleId,
        req.body.moduleId,
        req.body.ctrl
    );
    success(res, role);
});

const revokeModule = asyncHandler(async (req, res) => {
    await rolesService.revokeModule(
        req.app.locals.db.sequelize,
        req.params.roleId,
        req.params.moduleId
    );
    res.status(204).end();
});

module.exports = {
    getRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
    assignModule,
    revokeModule,
};