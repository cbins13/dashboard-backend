'use strict';

const { getModelSchema } = require('../../models/modelSchemas');

const defineUser = (sequelize, DataTypes) => {
    const User = sequelize.define(
        'User',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                field: 'ID',
            },
            username: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
                field: 'USERNAME',
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: false,
                field: 'PASSWORD',
            },
            displayname: {
                type: DataTypes.STRING(255),
                allowNull: false,
                field: 'DISPLAYNAME',
            },
            userstatus: {
                type: DataTypes.STRING(20),
                allowNull: false,
                defaultValue: 'ACTIVE',
                field: 'USERSTATUS',
            },
            archived: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                field: 'ARCHIVED',
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
            schema: getModelSchema('User') || getModelSchema('Users') || undefined,
            tableName: 'USERS',
            freezeTableName: true,
            timestamps: false,
        }
    );

    return User;
};

module.exports = defineUser;
