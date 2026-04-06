'use strict';

const { getModelSchema } = require('../../models/modelSchemas');

const defineRoleModule = (sequelize, DataTypes) => {
    const RoleModule = sequelize.define(
        'RoleModule',
        {
            roleId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                field: 'ROLE_ID',
            },
            moduleId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                field: 'MODULE_ID',
            },
            ctrl: {
                type: DataTypes.STRING(100),
                allowNull: false,
                defaultValue: 'VIEW',
                field: 'CTRL',
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
            schema: getModelSchema('RoleModule') || undefined,
            tableName: 'ROLE_MODULE',
            freezeTableName: true,
            timestamps: false,
        }
    );

    return RoleModule;
};

module.exports = defineRoleModule;
