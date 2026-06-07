'use strict';

const { getModelSchema } = require('../../../models/modelSchemas');

const qualifyTable = (modelName, tableName) => {
    const schema = getModelSchema(modelName);
    return schema ? `${schema}.${tableName}` : tableName;
};

const buildUserInclude = (sequelize, includeRoles = false) => {
    if (!includeRoles) {
        return undefined;
    }

    const { Role } = sequelize.models;

    return [
        {
            model: Role,
            as: 'roles',
            through: { attributes: [] },
        },
    ];
};

const findAll = async (sequelize, { includeRoles = false } = {}) => {
    const { User } = sequelize.models;
    return User.findAll({
        include: buildUserInclude(sequelize, includeRoles),
    });
};

const findById = async (sequelize, userId, { includeRoles = false } = {}) => {
    const { User } = sequelize.models;
    return User.findByPk(userId, {
        include: buildUserInclude(sequelize, includeRoles),
    });
};

const findByUsername = async (sequelize, username) => {
    const { User } = sequelize.models;
    return User.findOne({ where: { username } });
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
    const { User, UserRole } = sequelize.models;

    return sequelize.transaction(async (transaction) => {
        await UserRole.destroy({ where: { userId }, transaction });
        return User.destroy({ where: { id: userId }, transaction });
    });
};

const assignRole = async (sequelize, userId, roleId) => {
    const { User, Role } = sequelize.models;
    const user = await User.findByPk(userId);
    const role = await Role.findByPk(roleId);

    if (!user || !role) {
        return null;
    }

    const userRoleTable = qualifyTable('UserRole', 'USER_ROLE');
    const [existingAssignmentRows] = await sequelize.query(
        `SELECT COUNT(1) AS ASSIGNMENT_COUNT
         FROM ${userRoleTable}
         WHERE USER_ID = :userId AND ROLE_ID = :roleId`,
        { replacements: { userId, roleId } }
    );

    const existingAssignmentCount = Number(existingAssignmentRows?.[0]?.ASSIGNMENT_COUNT || 0);

    if (existingAssignmentCount > 0) {
        return { userId, roleId, existed: true };
    }

    await sequelize.query(
        `INSERT INTO ${userRoleTable} (USER_ID, ROLE_ID, CREATEDON, UPDATEDON)
         VALUES (:userId, :roleId, SYSTIMESTAMP, SYSTIMESTAMP)`,
        { replacements: { userId, roleId } }
    );

    return { userId, roleId, existed: false };
};

const revokeRole = async (sequelize, userId, roleId) => {
    const { User, Role, UserRole } = sequelize.models;
    const user = await User.findByPk(userId);
    const role = await Role.findByPk(roleId);

    if (!user || !role) {
        return false;
    }

    const deleted = await UserRole.destroy({
        where: {
            userId,
            roleId,
        },
    });

    return deleted > 0;
};

const findUserRoles = async (sequelize, userId) => {
    const user = await findById(sequelize, userId, { includeRoles: true });

    if (!user) {
        return null;
    }

    return user.roles || [];
};

module.exports = { findAll, findById, findByUsername, create, update, remove, assignRole, revokeRole, findUserRoles };
