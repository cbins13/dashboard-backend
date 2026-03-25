'use strict';

const findAll = async (sequelize) => {
    const { User } = sequelize.models;
    return User.findAll();
};

const findById = async (sequelize, userId) => {
    const { User } = sequelize.models;
    return User.findByPk(userId);
};

const create = async (sequelize, data) => {
    const { User } = sequelize.models;
    return User.create(data);
};

const update = async (sequelize, userId, data) => {
    const { User } = sequelize.models;
    const [affectedCount] = await User.update(data, { where: { id: userId } });

    if (affectedCount === 0) return null;

    return User.findByPk(userId);
};

const remove = async (sequelize, userId) => {
    const { User } = sequelize.models;
    return User.destroy({ where: { id: userId } });
};

module.exports = { findAll, findById, create, update, remove };
