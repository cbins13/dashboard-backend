'use strict';

const AppError = require('../../common/errors/AppError');
const modulesRepository = require('./modules.repository');

const safeModule = (module) => {
    const plain = module.get ? module.get({ plain: true }) : module;
    return {
        id: plain.id,
        code: plain.code,
        name: plain.name,
        route: plain.route,
        status: plain.status,
    };
};

const safeCategory = (category) => {
    const plain = category.get ? category.get({ plain: true }) : category;
    return {
        id: plain.id,
        code: plain.code,
        name: plain.name,
        sortOrder: plain.sortOrder,
        modules: (plain.modules || []).map(safeModule),
    };
};

const getAll = async (sequelize) => {
    const categories = await modulesRepository.findAllCategories(sequelize);
    return categories.map(safeCategory);
};

const getById = async (sequelize, categoryId) => {
    const category = await modulesRepository.findCategoryById(sequelize, categoryId);

    if (!category) {
        throw new AppError(404, 'Module category not found.');
    }

    return safeCategory(category);
};

const create = async (sequelize, categoryId, data) => {
    const existing = await modulesRepository.findModuleByCode(sequelize, data.code);

    if (existing) {
        throw new AppError(409, 'Module code already exists.');
    }

    const category = await modulesRepository.findCategoryById(sequelize, categoryId);

    if (!category) {
        throw new AppError(404, 'Module category not found.');
    }

    const module = await modulesRepository.createModule(sequelize, {
        ...data,
        moduleCategoryId: categoryId,
        route: data.route || null,
        status: data.status || 'ACTIVE',
    });

    return safeModule(module);
};

const update = async (sequelize, moduleId, data) => {
    const module = await modulesRepository.updateModule(sequelize, moduleId, data);

    if (!module) {
        throw new AppError(404, 'Module not found.');
    }

    return safeModule(module);
};

const remove = async (sequelize, moduleId) => {
    const deleted = await modulesRepository.removeModule(sequelize, moduleId);

    if (deleted === 0) {
        throw new AppError(404, 'Module not found.');
    }
};

module.exports = { getAll, getById, create, update, remove };