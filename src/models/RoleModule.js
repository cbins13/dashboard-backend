'use strict';

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
            tableName: 'ROLE_MODULE',
            freezeTableName: true,
            timestamps: false,
        }
    );

    return RoleModule;
};

module.exports = defineRoleModule;
