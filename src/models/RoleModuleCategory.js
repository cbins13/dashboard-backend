'use strict';

const { getModelSchema } = require('../../models/modelSchemas');

const defineRoleModuleCategory = (sequelize, DataTypes) => {
    const RoleModuleCategory = sequelize.define(
        'RoleModuleCategory',
        {
            roleId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                field: 'ROLE_ID',
            },
            moduleCategoryId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                field: 'MODULE_CATEGORY_ID',
            },
            createdon: {
                type: DataTypes.DATE,
                allowNull: false,
                field: 'CREATEDON',
            },
            updatedon: {
                type: DataTypes.DATE,
                allowNull: false,
                field: 'UPDATEDON',
            },
        },
        {
            schema: getModelSchema('RoleModuleCategory') || undefined,
            tableName: 'ROLE_MODULE_CATEGORY',
            freezeTableName: true,
            timestamps: false,
        }
    );

    return RoleModuleCategory;
};

module.exports = defineRoleModuleCategory;