'use strict';

const findUserByUsername = async (sequelize, username) => {
    const { User } = sequelize.models;
    return User.findOne({ where: { username } });
};

const findUserByEmail = async (sequelize, email) => {
    const { User } = sequelize.models;
    return User.findOne({ where: { email } });
};

module.exports = { findUserByUsername, findUserByEmail };
