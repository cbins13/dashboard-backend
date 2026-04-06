'use strict';

const { getModelSchema } = require('../../models/modelSchemas');

const defineRole = (sequelize, DataTypes) => {
    const Role = sequelize.define(
        'Role',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
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
            schema: getModelSchema('Role') || undefined,
            tableName: 'ROLE',
            freezeTableName: true,
            timestamps: false,
        }
    );

    return Role;
};

module.exports = defineRole;
