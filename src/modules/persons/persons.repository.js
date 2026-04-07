'use strict';

const findAll = async (sequelize) => {
    const { Person } = sequelize.models;
    return Person.findAll();
};

const findById = async (sequelize, personId) => {
    const { Person } = sequelize.models;
    return Person.findByPk(personId);
};

const create = async (sequelize, data) => {
    const { Person } = sequelize.models;
    return Person.create(data);
};

const update = async (sequelize, personId, data) => {
    const { Person } = sequelize.models;
    const [affectedCount] = await Person.update(data, { where: { id: personId } });

    if (affectedCount === 0) return null;

    return Person.findByPk(personId);
};

const remove = async (sequelize, personId) => {
    const { Person } = sequelize.models;
    return Person.destroy({ where: { id: personId } });
};

module.exports = { findAll, findById, create, update, remove };
