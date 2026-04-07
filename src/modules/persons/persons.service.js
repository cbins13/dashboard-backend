'use strict';

const AppError = require('../../common/errors/AppError');
const personsRepository = require('./persons.repository');

const safePerson = (person) => {
    const { id, name, age, height } = person.get ? person.get({ plain: true }) : person;
    return { id, name, age, height };
};

const getAll = async (sequelize) => {
    const persons = await personsRepository.findAll(sequelize);
    return persons.map(safePerson);
};

const getById = async (sequelize, personId) => {
    const person = await personsRepository.findById(sequelize, personId);
    if (!person) throw new AppError(404, 'Person not found.');
    return safePerson(person);
};

const create = async (sequelize, data) => {
    const person = await personsRepository.create(sequelize, data);
    return safePerson(person);
};

const update = async (sequelize, personId, data) => {
    const person = await personsRepository.update(sequelize, personId, data);
    if (!person) throw new AppError(404, 'Person not found.');
    return safePerson(person);
};

const remove = async (sequelize, personId) => {
    const deleted = await personsRepository.remove(sequelize, personId);
    if (deleted === 0) throw new AppError(404, 'Person not found.');
};

module.exports = { getAll, getById, create, update, remove };
