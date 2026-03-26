'use strict';

const defineModule = (sequelize, DataTypes) => {
    const Module = sequelize.define(
        'Module',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                field: 'ID',
            },
            code: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
                field: 'CODE',
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
                field: 'NAME',
            },
            route: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: 'ROUTE',
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
            tableName: 'MODULE',
            freezeTableName: true,
            timestamps: false,
        }
    );

    return Module;
};

module.exports = defineModule;
