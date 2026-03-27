'use strict';

const asyncHandler = require('../../common/asyncHandler');
const { success } = require('../../common/http/response');
const modulesService = require('./modules.service');

const getCategories = asyncHandler(async (req, res) => {
    const categories = await modulesService.getAll(req.app.locals.db.sequelize);
    success(res, categories);
});

const getCategory = asyncHandler(async (req, res) => {
    const category = await modulesService.getById(req.app.locals.db.sequelize, req.params.categoryId);
    success(res, category);
});

const createModule = asyncHandler(async (req, res) => {
    const module = await modulesService.create(
        req.app.locals.db.sequelize,
        req.params.categoryId,
        req.body
    );
    success(res, module, 201);
});

const updateModule = asyncHandler(async (req, res) => {
    const module = await modulesService.update(req.app.locals.db.sequelize, req.params.moduleId, req.body);
    success(res, module);
});

const deleteModule = asyncHandler(async (req, res) => {
    await modulesService.remove(req.app.locals.db.sequelize, req.params.moduleId);
    res.status(204).end();
});

module.exports = { getCategories, getCategory, createModule, updateModule, deleteModule };