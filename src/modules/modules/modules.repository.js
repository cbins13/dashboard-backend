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
    const { Module, RoleModule } = sequelize.models;

    return sequelize.transaction(async (transaction) => {
        await RoleModule.destroy({ where: { moduleId }, transaction });
        return Module.destroy({ where: { id: moduleId }, transaction });
    });
};

const findCategoryByCode = async (sequelize, code) => {
    const { ModuleCategory } = sequelize.models;
    return ModuleCategory.findOne({ where: { code } });
};

const createCategory = async (sequelize, data) => {
    const { ModuleCategory } = sequelize.models;
    return ModuleCategory.create(data);
};

const updateCategory = async (sequelize, categoryId, data) => {
    const { ModuleCategory } = sequelize.models;
    const [affectedCount] = await ModuleCategory.update(data, { where: { id: categoryId } });

    if (affectedCount === 0) return null;

    return ModuleCategory.findByPk(categoryId);
};

const removeCategory = async (sequelize, categoryId) => {
    const { ModuleCategory, Module, RoleModule } = sequelize.models;

    return sequelize.transaction(async (transaction) => {
        const modules = await Module.findAll({
            where: { moduleCategoryId: categoryId },
            attributes: ['id'],
            transaction,
        });

        const moduleIds = modules.map((m) => m.id);

        if (moduleIds.length > 0) {
            await RoleModule.destroy({ where: { moduleId: moduleIds }, transaction });
            await Module.destroy({ where: { id: moduleIds }, transaction });
        }

        return ModuleCategory.destroy({ where: { id: categoryId }, transaction });
    });
};

module.exports = {
    findAllCategories,
    findCategoryById,
    findModuleByCode,
    createModule,
    updateModule,
    removeModule,
    findCategoryByCode,
    createCategory,
    updateCategory,
    removeCategory,
};