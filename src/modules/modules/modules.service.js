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
        status: plain.status,
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

    const now = new Date();
    const module = await modulesRepository.createModule(sequelize, {
        ...data,
        moduleCategoryId: categoryId,
        route: data.route || null,
        status: data.status || 'ACTIVE',
        createdon: now,
        updatedon: now,
    });

    return safeModule(module);
};

const update = async (sequelize, moduleId, data) => {
    const updated = { ...data, updatedon: new Date() };
    const module = await modulesRepository.updateModule(sequelize, moduleId, updated);

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

const createCategory = async (sequelize, data) => {
    const existing = await modulesRepository.findCategoryByCode(sequelize, data.code);

    if (existing) {
        throw new AppError(409, 'Module category code already exists.');
    }

    const now = new Date();
    const category = await modulesRepository.createCategory(sequelize, {
        code: data.code,
        name: data.name,
        sortOrder: data.sortOrder ?? 1,
        status: data.status ?? 'ACTIVE',
        createdon: now,
        updatedon: now,
    });

    return safeCategory(category);
};

const updateCategory = async (sequelize, categoryId, data) => {
    const updated = { ...data, updatedon: new Date() };
    const category = await modulesRepository.updateCategory(sequelize, categoryId, updated);

    if (!category) {
        throw new AppError(404, 'Module category not found.');
    }

    return safeCategory(category);
};

const removeCategory = async (sequelize, categoryId) => {
    const deleted = await modulesRepository.removeCategory(sequelize, categoryId);

    if (deleted === 0) {
        throw new AppError(404, 'Module category not found.');
    }
};

module.exports = { getAll, getById, create, update, remove, createCategory, updateCategory, removeCategory };