'use strict';

const AppError = require('../../common/errors/AppError');
const { hashPassword } = require('../../infrastructure/security/password');
const usersRepository = require('./users.repository');

const getAll = async (sequelize) => {
    const users = await usersRepository.findAll(sequelize);
    return users.map(safeUser);
};

const getById = async (sequelize, userId) => {
    const user = await usersRepository.findById(sequelize, userId);

    if (!user) throw new AppError(404, 'User not found.');

    return safeUser(user);
};

const safeUser = (user) => {
    const { id, username, displayname, userstatus, archived, createdon, updatedon } =
        user.get ? user.get({ plain: true }) : user;
    return { id, username, displayname, userstatus, archived, createdon, updatedon };
};

const create = async (sequelize, data) => {
    const existing = await usersRepository.findByUsername(sequelize, data.username);

    if (existing) {
        throw new AppError(409, 'Username already exists.');
    }

    const { password, ...rest } = data;
    const hashedPassword = await hashPassword(password);
    const user = await usersRepository.create(sequelize, { ...rest, password: hashedPassword });
    return safeUser(user);
};

const update = async (sequelize, userId, data) => {
    const updateData = { ...data };

    if (updateData.username) {
        const existing = await usersRepository.findByUsername(sequelize, updateData.username);

        if (existing && String(existing.id) !== String(userId)) {
            throw new AppError(409, 'Username already exists.');
        }
    }

    if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
    }

    const user = await usersRepository.update(sequelize, userId, updateData);

    if (!user) throw new AppError(404, 'User not found.');

    return safeUser(user);
};

const remove = async (sequelize, userId) => {
    const deleted = await usersRepository.remove(sequelize, userId);

    if (deleted === 0) throw new AppError(404, 'User not found.');
};

module.exports = { getAll, getById, create, update, remove };
