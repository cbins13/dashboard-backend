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
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            displayname: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            userstatus: {
                type: DataTypes.STRING(20),
                allowNull: false,
                defaultValue: 'ACTIVE',
            },
            archived: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            createdon: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            updatedon: {
                type: DataTypes.DATE,
                allowNull: false,
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
