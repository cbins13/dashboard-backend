'use strict';

const AppError = require('../../common/errors/AppError');
const { hashPassword } = require('../../infrastructure/security/password');
const usersRepository = require('./users.repository');

const getAll = async (sequelize) => {
    const users = await usersRepository.findAll(sequelize, { includeRoles: true });
    return users.map(safeUser);
};

const getById = async (sequelize, userId) => {
    const user = await usersRepository.findById(sequelize, userId, { includeRoles: true });

    if (!user) throw new AppError(404, 'User not found.');

    return safeUser(user);
};

const safeUser = (user) => {
    const {
        id,
        username,
        displayname,
        userstatus,
        archived,
        createdon,
        updatedon,
        roles,
    } = user.get ? user.get({ plain: true }) : user;

    return {
        id,
        username,
        displayname,
        userstatus,
        archived,
        createdon,
        updatedon,
        ...(Array.isArray(roles)
            ? {
                  roles: roles.map(({ id: roleId, code, name, status }) => ({
                      id: roleId,
                      code,
                      name,
                      status,
                  })),
              }
            : {}),
    };
};

const create = async (sequelize, data) => {
    const existing = await usersRepository.findByUsername(sequelize, data.username);

    if (existing) {
        throw new AppError(409, 'Username already exists.');
    }

    const { password, ...rest } = data;
    const hashedPassword = await hashPassword(password);
    const now = new Date();
    const user = await usersRepository.create(sequelize, { ...rest, password: hashedPassword, createdon: now, updatedon: now });
    return safeUser(user);
};

const update = async (sequelize, userId, data) => {
    const updateData = { ...data, updatedon: new Date() };
    const { roleId } = updateData;
    delete updateData.roleId;

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

    if (roleId) {
        const { Role } = sequelize.models;
        const role = await Role.findByPk(roleId);

        if (!role) {
            throw new AppError(404, 'Role not found.');
        }

        await usersRepository.assignRole(sequelize, userId, roleId);
    }

    return getById(sequelize, userId);
};

const remove = async (sequelize, userId) => {
    const deleted = await usersRepository.remove(sequelize, userId);

    if (deleted === 0) throw new AppError(404, 'User not found.');
};

const assignRole = async (sequelize, userId, roleId) => {
    const user = await usersRepository.findById(sequelize, userId);

    if (!user) {
        throw new AppError(404, 'User not found.');
    }

    const { Role } = sequelize.models;
    const role = await Role.findByPk(roleId);

    if (!role) {
        throw new AppError(404, 'Role not found.');
    }

    const assignment = await usersRepository.assignRole(sequelize, userId, roleId);

    if (!assignment) {
        throw new AppError(500, 'Failed to assign role.');
    }

    return getById(sequelize, userId);
};

const revokeRole = async (sequelize, userId, roleId) => {
    const user = await usersRepository.findById(sequelize, userId);

    if (!user) {
        throw new AppError(404, 'User not found.');
    }

    const { Role } = sequelize.models;
    const role = await Role.findByPk(roleId);

    if (!role) {
        throw new AppError(404, 'Role not found.');
    }

    const removed = await usersRepository.revokeRole(sequelize, userId, roleId);

    if (!removed) {
        throw new AppError(404, 'User does not have this role assigned.');
    }
};

module.exports = { getAll, getById, create, update, remove, assignRole, revokeRole };
