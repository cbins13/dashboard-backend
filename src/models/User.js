'use strict';

const defineUser = (sequelize, DataTypes) => {
    const User = sequelize.define(
        'User',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            username: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            },
            passwordHash: {
                type: DataTypes.STRING(255),
                allowNull: false,
                field: 'PASSWORD_HASH',
            },
        },
        {
            tableName: 'USERS',
            freezeTableName: true,
            timestamps: false,
        }
    );

    return User;
};

module.exports = defineUser;
