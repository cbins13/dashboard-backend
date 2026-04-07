const { getModelSchema } = require('../models/modelSchemas');

const getSchemaPrefix = (modelName) => {
    const schema = getModelSchema(modelName);
    return schema ? `${schema}.` : '';
};

module.exports = {
    name: '012-seed-person-management-module',
    up: async ({ queryInterface }) => {
        const catPrefix = getSchemaPrefix('ModuleCategory');
        const modPrefix = getSchemaPrefix('Module');
        const rolePrefix = getSchemaPrefix('Role');
        const rmPrefix = getSchemaPrefix('RoleModule');

        const catTable = `${catPrefix}MODULE_CATEGORY`;
        const modTable = `${modPrefix}MODULE`;
        const roleTable = `${rolePrefix}ROLE`;
        const rmTable = `${rmPrefix}ROLE_MODULE`;

        // 1. Seed MODULE_CATEGORY
        await queryInterface.sequelize.query(`
            INSERT INTO ${catTable} (CODE, NAME, SORT_ORDER, STATUS, CREATEDON, UPDATEDON)
            SELECT 'PERSON_MANAGEMENT', 'Person Management', 3, 'ACTIVE', SYSTIMESTAMP, SYSTIMESTAMP
            FROM DUAL
            WHERE NOT EXISTS (
                SELECT 1 FROM ${catTable} WHERE CODE = 'PERSON_MANAGEMENT'
            )
        `);

        // 2. Seed MODULE linked to the category
        await queryInterface.sequelize.query(`
            INSERT INTO ${modTable} (CODE, NAME, ROUTE, MODULE_CATEGORY_ID, STATUS, CREATEDON, UPDATEDON)
            SELECT 'PERSONS', 'Persons', '/person-management/persons', MC.ID, 'ACTIVE', SYSTIMESTAMP, SYSTIMESTAMP
            FROM ${catTable} MC
            WHERE MC.CODE = 'PERSON_MANAGEMENT'
              AND NOT EXISTS (
                SELECT 1 FROM ${modTable} WHERE CODE = 'PERSONS'
              )
        `);

        // 3. Grant ADMINISTRATOR full access
        await queryInterface.sequelize.query(`
            INSERT INTO ${rmTable} (ROLE_ID, MODULE_ID, CTRL, CREATEDON, UPDATEDON)
            SELECT R.ID, M.ID, 'VIEW,CREATE,EDIT,DELETE', SYSTIMESTAMP, SYSTIMESTAMP
            FROM ${roleTable} R
            CROSS JOIN ${modTable} M
            WHERE R.CODE = 'ADMINISTRATOR'
              AND M.CODE = 'PERSONS'
              AND NOT EXISTS (
                SELECT 1 FROM ${rmTable} RM
                WHERE RM.ROLE_ID = R.ID AND RM.MODULE_ID = M.ID
              )
        `);
    },
    down: async ({ queryInterface }) => {
        const catPrefix = getSchemaPrefix('ModuleCategory');
        const modPrefix = getSchemaPrefix('Module');
        const rmPrefix = getSchemaPrefix('RoleModule');

        const catTable = `${catPrefix}MODULE_CATEGORY`;
        const modTable = `${modPrefix}MODULE`;
        const rmTable = `${rmPrefix}ROLE_MODULE`;

        await queryInterface.sequelize.query(`
            DELETE FROM ${rmTable}
            WHERE MODULE_ID IN (
                SELECT ID FROM ${modTable} WHERE CODE = 'PERSONS'
            )
        `);

        await queryInterface.sequelize.query(`
            DELETE FROM ${modTable} WHERE CODE = 'PERSONS'
        `);

        await queryInterface.sequelize.query(`
            DELETE FROM ${catTable} WHERE CODE = 'PERSON_MANAGEMENT'
        `);
    },
};
