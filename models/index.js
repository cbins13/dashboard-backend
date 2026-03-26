const { DataTypes } = require('sequelize');
const definePerson = require('./Person');
const defineUser = require('./User');

const initializeModels = (sequelize) => ({
    Person: definePerson(sequelize, DataTypes),
    User: defineUser(sequelize, DataTypes),
});

module.exports = initializeModels;