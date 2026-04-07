'use strict';

const { getModelSchema } = require('../../models/modelSchemas');

const definePerson = (sequelize, DataTypes) => {
    const Person = sequelize.define(
        'Person',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
                field: 'ID',
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
                field: 'NAME',
            },
            age: {
                type: DataTypes.INTEGER,
                allowNull: true,
                field: 'AGE',
            },
            height: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: true,
                field: 'HEIGHT',
            },
        },
        {
            schema: getModelSchema('Person') || undefined,
            tableName: 'PERSON',
            freezeTableName: true,
            timestamps: false,
        }
    );

    return Person;
};

module.exports = definePerson;
