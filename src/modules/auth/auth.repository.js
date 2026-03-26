'use strict';

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
                modules: [],
                _modulesById: new Map(),
            };
            rolesById.set(row.ROLE_ID, role);
        }

        if (!row.MODULE_ID) {
            continue;
        }

        let module = role._modulesById.get(row.MODULE_ID);

        if (!module) {
            module = {
                id: row.MODULE_ID,
                code: row.MODULE_CODE,
                name: row.MODULE_NAME,
                route: row.MODULE_ROUTE,
                categories: [],
                _categoriesById: new Map(),
            };
            role._modulesById.set(row.MODULE_ID, module);
            role.modules.push(module);
        }

        if (!row.CATEGORY_ID || module._categoriesById.has(row.CATEGORY_ID)) {
            continue;
        }

        const category = {
            id: row.CATEGORY_ID,
            code: row.CATEGORY_CODE,
            name: row.CATEGORY_NAME,
            sortOrder: row.CATEGORY_SORT_ORDER,
        };

        module._categoriesById.set(row.CATEGORY_ID, category);
        module.categories.push(category);
    }

    const roles = Array.from(rolesById.values()).map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        modules: role.modules.map((module) => ({
            id: module.id,
            code: module.code,
            name: module.name,
            route: module.route,
            categories: [...module.categories].sort(
                (left, right) => (left.sortOrder || 0) - (right.sortOrder || 0)
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
    const [users] = await sequelize.query(
        `SELECT ID, USERNAME
         FROM USERS
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
            M.ID AS MODULE_ID,
            M.CODE AS MODULE_CODE,
            M.NAME AS MODULE_NAME,
            M.ROUTE AS MODULE_ROUTE,
            MC.ID AS CATEGORY_ID,
            MC.CODE AS CATEGORY_CODE,
            MC.NAME AS CATEGORY_NAME,
            MC.SORT_ORDER AS CATEGORY_SORT_ORDER
         FROM USER_ROLE UR
         LEFT JOIN ROLE R
            ON R.ID = UR.ROLE_ID
           AND R.STATUS = 'ACTIVE'
         LEFT JOIN ROLE_MODULE RM
            ON RM.ROLE_ID = R.ID
         LEFT JOIN MODULE M
            ON M.ID = RM.MODULE_ID
           AND M.STATUS = 'ACTIVE'
         LEFT JOIN MODULE_CATEGORY MC
            ON MC.MODULE_ID = M.ID
           AND MC.STATUS = 'ACTIVE'
         WHERE UR.USER_ID = :userId
         ORDER BY R.NAME ASC, M.NAME ASC, MC.SORT_ORDER ASC, MC.NAME ASC`,
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
