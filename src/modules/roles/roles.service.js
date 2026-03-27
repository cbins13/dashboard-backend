'use strict';

const AppError = require('../../common/errors/AppError');
const rolesRepository = require('./roles.repository');

const safeRole = (role) => {
    const plain = role.get ? role.get({ plain: true }) : role;

    // Group modules by their moduleCategory to produce categories[] → modules[]
    const categoriesById = new Map();

    for (const module of plain.modules || []) {
        const mc = module.moduleCategory;
        if (!mc) continue;

        if (!categoriesById.has(mc.id)) {
            categoriesById.set(mc.id, {
                id: mc.id,
                code: mc.code,
                name: mc.name,
                sortOrder: mc.sortOrder,
                modules: [],
            });
        }

        const ctrl = module.RoleModule?.ctrl ?? module.ROLE_MODULE?.ctrl ?? module.roleModule?.ctrl ?? 'VIEW';

        categoriesById.get(mc.id).modules.push({
            id: module.id,
            code: module.code,
            name: module.name,
            route: module.route,
            ctrl,
        });
    }

    const categories = Array.from(categoriesById.values())
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((cat) => ({
            ...cat,
            modules: cat.modules.sort((a, b) => a.name.localeCompare(b.name)),
        }));

    return {
        id: plain.id,
        code: plain.code,
        name: plain.name,
        status: plain.status,
        categories,
    };
};

const getAll = async (sequelize) => {
    const roles = await rolesRepository.findAll(sequelize);
    return roles.map(safeRole);
};

const getById = async (sequelize, roleId) => {
    const role = await rolesRepository.findById(sequelize, roleId);

    if (!role) {
        throw new AppError(404, 'Role not found.');
    }

    return safeRole(role);
};

const create = async (sequelize, data) => {
    const existing = await rolesRepository.findByCode(sequelize, data.code);

    if (existing) {
        throw new AppError(409, 'Role code already exists.');
    }

    const role = await rolesRepository.create(sequelize, data);
    return safeRole(role);
};

const update = async (sequelize, roleId, data) => {
    const role = await rolesRepository.update(sequelize, roleId, data);

    if (!role) {
        throw new AppError(404, 'Role not found.');
    }

    return safeRole(role);
};

const remove = async (sequelize, roleId) => {
    const role = await rolesRepository.findById(sequelize, roleId);

    if (!role) {
        throw new AppError(404, 'Role not found.');
    }

    if (String(role.code).toUpperCase() === 'ADMINISTRATOR') {
        throw new AppError(403, 'Administrator role cannot be deleted.');
    }

    await rolesRepository.remove(sequelize, roleId);
};

const assignModule = async (sequelize, roleId, moduleId, ctrl = 'VIEW') => {
    const role = await rolesRepository.assignModule(sequelize, roleId, moduleId, ctrl);

    if (!role) {
        throw new AppError(404, 'Role or module not found.');
    }

    return safeRole(role);
};

const revokeModule = async (sequelize, roleId, moduleId) => {
    const removed = await rolesRepository.revokeModule(sequelize, roleId, moduleId);

    if (!removed) {
        throw new AppError(404, 'Role or module not found.');
    }
};

module.exports = { getAll, getById, create, update, remove, assignModule, revokeModule };
