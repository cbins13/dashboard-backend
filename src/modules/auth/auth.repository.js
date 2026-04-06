'use strict';

const { getModelSchema } = require('../../../models/modelSchemas');

const qualifyTable = (modelName, tableName) => {
    const schema = getModelSchema(modelName);
    return schema ? `${schema}.${tableName}` : tableName;
};

const findUserByUsername = async (sequelize, username) => {
    const { User } = sequelize.models;
    return User.findOne({ where: { username } });
};

const buildAccessTree = (user, rows) => {
    const rolesById = new Map();

    for (const row of rows) {
        if (!row.ROLE_ID) {
            continue;
        }

        let role = rolesById.get(row.ROLE_ID);

        if (!role) {
            role = {
                id: row.ROLE_ID,
                code: row.ROLE_CODE,
                name: row.ROLE_NAME,
                categories: [],
                _categoriesById: new Map(),
            };
            rolesById.set(row.ROLE_ID, role);
        }

        if (!row.MODULE_CATEGORY_ID) {
            continue;
        }

        let category = role._categoriesById.get(row.MODULE_CATEGORY_ID);

        if (!category) {
            category = {
                id: row.MODULE_CATEGORY_ID,
                code: row.MODULE_CATEGORY_CODE,
                name: row.MODULE_CATEGORY_NAME,
                sortOrder: row.MODULE_CATEGORY_SORT_ORDER,
                modules: [],
                _modulesById: new Map(),
            };
            role._categoriesById.set(row.MODULE_CATEGORY_ID, category);
            role.categories.push(category);
        }

        if (!row.MODULE_ID || category._modulesById.has(row.MODULE_ID)) {
            continue;
        }

        const module = {
            id: row.MODULE_ID,
            code: row.MODULE_CODE,
            name: row.MODULE_NAME,
            route: row.MODULE_ROUTE,
            ctrl: row.CTRL ?? 'VIEW',
        };

        category._modulesById.set(row.MODULE_ID, module);
        category.modules.push(module);
    }

    const roles = Array.from(rolesById.values()).map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        categories: role.categories
            .sort((left, right) => (left.sortOrder || 0) - (right.sortOrder || 0))
            .map((category) => ({
                id: category.id,
                code: category.code,
                name: category.name,
                sortOrder: category.sortOrder,
                modules: [...category.modules].sort((left, right) =>
                    left.name.localeCompare(right.name)
                ),
            })),
    }));

    return {
        id: user.ID,
        username: user.USERNAME,
        roles,
    };
};

const findUserAccessById = async (sequelize, userId) => {
    const usersTable = qualifyTable('User', 'USERS');
    const userRoleTable = qualifyTable('UserRole', 'USER_ROLE');
    const roleTable = qualifyTable('Role', 'ROLE');
    const roleModuleTable = qualifyTable('RoleModule', 'ROLE_MODULE');
    const moduleTable = qualifyTable('Module', 'MODULE');
    const moduleCategoryTable = qualifyTable('ModuleCategory', 'MODULE_CATEGORY');

    const [users] = await sequelize.query(
        `SELECT ID, USERNAME
         FROM ${usersTable}
         WHERE ID = :userId`,
        { replacements: { userId } }
    );

    const user = users[0];

    if (!user) {
        return null;
    }

    const [rows] = await sequelize.query(
        `SELECT
            R.ID AS ROLE_ID,
            R.CODE AS ROLE_CODE,
            R.NAME AS ROLE_NAME,
            MC.ID AS MODULE_CATEGORY_ID,
            MC.CODE AS MODULE_CATEGORY_CODE,
            MC.NAME AS MODULE_CATEGORY_NAME,
            MC.SORT_ORDER AS MODULE_CATEGORY_SORT_ORDER,
            M.ID AS MODULE_ID,
            M.CODE AS MODULE_CODE,
            M.NAME AS MODULE_NAME,
            M.ROUTE AS MODULE_ROUTE,
            RM.CTRL AS CTRL
         FROM ${userRoleTable} UR
         LEFT JOIN ${roleTable} R
            ON R.ID = UR.ROLE_ID
           AND R.STATUS = 'ACTIVE'
         LEFT JOIN ${roleModuleTable} RM
            ON RM.ROLE_ID = R.ID
         LEFT JOIN ${moduleTable} M
            ON M.ID = RM.MODULE_ID
           AND M.STATUS = 'ACTIVE'
         LEFT JOIN ${moduleCategoryTable} MC
            ON MC.ID = M.MODULE_CATEGORY_ID
           AND MC.STATUS = 'ACTIVE'
         WHERE UR.USER_ID = :userId
         ORDER BY R.NAME ASC, MC.SORT_ORDER ASC, M.NAME ASC`,
        { replacements: { userId } }
    );

    return buildAccessTree(user, rows);
};

const findUserByEmail = async (sequelize, email) => {
    // USERS schema currently authenticates by username only.
    // Return null for email-based attempts to keep login response semantics generic.
    return null;
};

module.exports = {
    findUserByUsername,
    findUserByEmail,
    findUserAccessById,
};
