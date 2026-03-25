'use strict';

const { DataTypes } = require('sequelize');
const defineUser = require('./User');

const initializeModels = (sequelize) => ({
    User: defineUser(sequelize, DataTypes),
});

module.exports = initializeModels;
