'use strict';

const { getModelSchema } = require('../../../models/modelSchemas');

const qualifyTable = (modelName, tableName) => {
    const schema = getModelSchema(modelName);
    return schema ? `${schema}.${tableName}` : tableName;
};

const mapRoleRows = (rows) => {
    const rolesById = new Map();

    for (const row of rows) {
        let role = rolesById.get(row.ROLE_ID);

        if (!role) {
            role = {
                id: row.ROLE_ID,
                code: row.ROLE_CODE,
                name: row.ROLE_NAME,
                status: row.ROLE_STATUS,
                modules: [],
            };
            rolesById.set(row.ROLE_ID, role);
        }

        if (!row.MODULE_ID) {
            continue;
        }

        role.modules.push({
            id: row.MODULE_ID,
            code: row.MODULE_CODE,
            name: row.MODULE_NAME,
            route: row.MODULE_ROUTE,
            RoleModule: {
                ctrl: row.MODULE_CTRL,
            },
            moduleCategory: row.MODULE_CATEGORY_ID
                ? {
                      id: row.MODULE_CATEGORY_ID,
                      code: row.MODULE_CATEGORY_CODE,
                      name: row.MODULE_CATEGORY_NAME,
                      sortOrder: row.MODULE_CATEGORY_SORT_ORDER,
                  }
                : null,
        });
    }

    return Array.from(rolesById.values());
};

const findRoleRows = async (sequelize, roleId = null) => {
    const roleTable = qualifyTable('Role', 'ROLE');
    const roleModuleTable = qualifyTable('RoleModule', 'ROLE_MODULE');
    const moduleTable = qualifyTable('Module', 'MODULE');
    const moduleCategoryTable = qualifyTable('ModuleCategory', 'MODULE_CATEGORY');

    const whereClause = roleId === null ? '' : 'WHERE R.ID = :roleId';

    const [rows] = await sequelize.query(
        `SELECT
            R.ID AS ROLE_ID,
            R.CODE AS ROLE_CODE,
            R.NAME AS ROLE_NAME,
            R.STATUS AS ROLE_STATUS,
            RM.CTRL AS MODULE_CTRL,
            M.ID AS MODULE_ID,
            M.CODE AS MODULE_CODE,
            M.NAME AS MODULE_NAME,
            M.ROUTE AS MODULE_ROUTE,
            MC.ID AS MODULE_CATEGORY_ID,
            MC.CODE AS MODULE_CATEGORY_CODE,
            MC.NAME AS MODULE_CATEGORY_NAME,
            MC.SORT_ORDER AS MODULE_CATEGORY_SORT_ORDER
         FROM ${roleTable} R
         LEFT JOIN ${roleModuleTable} RM
            ON RM.ROLE_ID = R.ID
         LEFT JOIN ${moduleTable} M
            ON M.ID = RM.MODULE_ID
         LEFT JOIN ${moduleCategoryTable} MC
            ON MC.ID = M.MODULE_CATEGORY_ID
         ${whereClause}
         ORDER BY R.NAME ASC, MC.SORT_ORDER ASC, M.NAME ASC`,
        roleId === null ? undefined : { replacements: { roleId } }
    );

    return rows;
};

const findAll = async (sequelize) => {
    const rows = await findRoleRows(sequelize);
    return mapRoleRows(rows);
};

const findById = async (sequelize, roleId) => {
    const rows = await findRoleRows(sequelize, roleId);
    const [role] = mapRoleRows(rows);
    return role || null;
};

const findByCode = async (sequelize, code) => {
    const { Role } = sequelize.models;
    return Role.findOne({ where: { code } });
};

const create = async (sequelize, data) => {
    const { Role } = sequelize.models;
    return Role.create(data);
};

const update = async (sequelize, roleId, data) => {
    const { Role } = sequelize.models;
    const [affectedCount] = await Role.update(data, { where: { id: roleId } });

    if (affectedCount === 0) return null;

    return Role.findByPk(roleId);
};

const remove = async (sequelize, roleId) => {
    const { Role } = sequelize.models;
    return Role.destroy({ where: { id: roleId } });
};

const assignModule = async (sequelize, roleId, moduleId, ctrl = 'VIEW') => {
    const { Role, Module, RoleModule } = sequelize.models;
    const role = await Role.findByPk(roleId);
    const module = await Module.findByPk(moduleId);

    if (!role || !module) {
        return null;
    }

    const existingAssignment = await RoleModule.findOne({
        where: {
            roleId,
            moduleId,
        },
    });

    if (existingAssignment) {
        await RoleModule.update(
            { ctrl },
            {
                where: {
                    roleId,
                    moduleId,
                },
            }
        );
    } else {
        await sequelize.query(
            `INSERT INTO ${qualifyTable('RoleModule', 'ROLE_MODULE')} (ROLE_ID, MODULE_ID, CTRL, CREATEDON, UPDATEDON)
             VALUES (:roleId, :moduleId, :ctrl, SYSTIMESTAMP, SYSTIMESTAMP)`,
            {
                replacements: {
                    roleId,
                    moduleId,
                    ctrl,
                },
            }
        );
    }

    return findById(sequelize, roleId);
};

const revokeModule = async (sequelize, roleId, moduleId) => {
    const { Role, Module } = sequelize.models;
    const role = await Role.findByPk(roleId);
    const module = await Module.findByPk(moduleId);

    if (!role || !module) {
        return false;
    }

    await role.removeModule(module);
    return true;
};

module.exports = {
    findAll,
    findById,
    findByCode,
    create,
    update,
    remove,
    assignModule,
    revokeModule,
};
