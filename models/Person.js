const definePerson = (sequelize, DataTypes) => {
    const Person = sequelize.define(
        'Person',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            age: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            height: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: true,
            },
        },
        {
            tableName: 'PERSON',
            freezeTableName: true,
            timestamps: false,
        }
    );

    return Person;
};

module.exports = definePerson;