'use strict';

const findUserByUsername = async (sequelize, username) => {
    const { User } = sequelize.models;
    return User.findOne({ where: { username } });
};

const findUserByEmail = async (sequelize, email) => {
    // USERS schema currently authenticates by username only.
    // Return null for email-based attempts to keep login response semantics generic.
    return null;
};

module.exports = { findUserByUsername, findUserByEmail };
