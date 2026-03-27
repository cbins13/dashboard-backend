'use strict';

const findAllCategories = async (sequelize) => {
    const { ModuleCategory, Module } = sequelize.models;
    return ModuleCategory.findAll({
        include: [
            {
                model: Module,
                as: 'modules',
            },
        ],
        order: [['sortOrder', 'ASC']],
    });
};

const findCategoryById = async (sequelize, categoryId) => {
    const { ModuleCategory, Module } = sequelize.models;
    return ModuleCategory.findByPk(categoryId, {
        include: [
            {
                model: Module,
                as: 'modules',
            },
        ],
    });
};

const findModuleByCode = async (sequelize, code) => {
    const { Module } = sequelize.models;
    return Module.findOne({ where: { code } });
};

const createModule = async (sequelize, data) => {
    const { Module } = sequelize.models;
    return Module.create(data);
};

const updateModule = async (sequelize, moduleId, data) => {
    const { Module } = sequelize.models;
    const [affectedCount] = await Module.update(data, { where: { id: moduleId } });

    if (affectedCount === 0) return null;

    return Module.findByPk(moduleId);
};

const removeModule = async (sequelize, moduleId) => {
    const { Module } = sequelize.models;
    return Module.destroy({ where: { id: moduleId } });
};

module.exports = {
    findAllCategories,
    findCategoryById,
    findModuleByCode,
    createModule,
    updateModule,
    removeModule,
};