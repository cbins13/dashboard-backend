'use strict';

const defineUserRole = (sequelize, DataTypes) => {
    const UserRole = sequelize.define(
        'UserRole',
        {
            userId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                field: 'USER_ID',
            },
            roleId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                field: 'ROLE_ID',
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
            tableName: 'USER_ROLE',
            freezeTableName: true,
            timestamps: false,
        }
    );

    return UserRole;
};

module.exports = defineUserRole;
