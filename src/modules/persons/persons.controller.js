'use strict';

const asyncHandler = require('../../common/asyncHandler');
const { success } = require('../../common/http/response');
const personsService = require('./persons.service');

const getPersons = asyncHandler(async (req, res) => {
    const persons = await personsService.getAll(req.app.locals.db.sequelize);
    success(res, persons);
});

const getPerson = asyncHandler(async (req, res) => {
    const person = await personsService.getById(req.app.locals.db.sequelize, req.params.personId);
    success(res, person);
});

const createPerson = asyncHandler(async (req, res) => {
    const person = await personsService.create(req.app.locals.db.sequelize, req.body);
    success(res, person, 201);
});

const updatePerson = asyncHandler(async (req, res) => {
    const person = await personsService.update(
        req.app.locals.db.sequelize,
        req.params.personId,
        req.body
    );
    success(res, person);
});

const deletePerson = asyncHandler(async (req, res) => {
    await personsService.remove(req.app.locals.db.sequelize, req.params.personId);
    res.status(204).end();
});

module.exports = { getPersons, getPerson, createPerson, updatePerson, deletePerson };
