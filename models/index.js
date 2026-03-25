const { DataTypes } = require('sequelize');
const definePerson = require('./Person');

const initializeModels = (sequelize) => ({
    Person: definePerson(sequelize, DataTypes),
});

module.exports = initializeModels;