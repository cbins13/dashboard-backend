'use strict';

const { DataTypes } = require('sequelize');
const defineUser = require('./User');
const defineRole = require('./Role');
const defineModule = require('./Module');
const defineModuleCategory = require('./ModuleCategory');
const defineUserRole = require('./UserRole');
const defineRoleModule = require('./RoleModule');
const definePerson = require('./Person');

const initializeModels = (sequelize) => {
    const models = {
        User: defineUser(sequelize, DataTypes),
        Role: defineRole(sequelize, DataTypes),
        Module: defineModule(sequelize, DataTypes),
        ModuleCategory: defineModuleCategory(sequelize, DataTypes),
        UserRole: defineUserRole(sequelize, DataTypes),
        RoleModule: defineRoleModule(sequelize, DataTypes),
        Person: definePerson(sequelize, DataTypes),
    };

    const { User, Role, Module, ModuleCategory, UserRole, RoleModule } = models;

    User.belongsToMany(Role, {
        through: UserRole,
        as: 'roles',
        foreignKey: 'userId',
        otherKey: 'roleId',
    });

    Role.belongsToMany(User, {
        through: UserRole,
        as: 'users',
        foreignKey: 'roleId',
        otherKey: 'userId',
    });

    Role.belongsToMany(Module, {
        through: RoleModule,
        as: 'modules',
        foreignKey: 'roleId',
        otherKey: 'moduleId',
    });

    Module.belongsToMany(Role, {
        through: RoleModule,
        as: 'roles',
        foreignKey: 'moduleId',
        otherKey: 'roleId',
    });

    ModuleCategory.hasMany(Module, {
        as: 'modules',
        foreignKey: 'moduleCategoryId',
    });

    Module.belongsTo(ModuleCategory, {
        as: 'moduleCategory',
        foreignKey: 'moduleCategoryId',
    });

    return models;
};

module.exports = initializeModels;
