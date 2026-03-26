'use strict';

const defineModuleCategory = (sequelize, DataTypes) => {
    const ModuleCategory = sequelize.define(
        'ModuleCategory',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                field: 'ID',
            },
            moduleId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                field: 'MODULE_ID',
            },
            code: {
                type: DataTypes.STRING(100),
                allowNull: false,
                field: 'CODE',
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
                field: 'NAME',
            },
            sortOrder: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
                field: 'SORT_ORDER',
            },
            status: {
                type: DataTypes.STRING(20),
                allowNull: false,
                defaultValue: 'ACTIVE',
                field: 'STATUS',
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
            tableName: 'MODULE_CATEGORY',
            freezeTableName: true,
            timestamps: false,
        }
    );

    return ModuleCategory;
};

module.exports = defineModuleCategory;
