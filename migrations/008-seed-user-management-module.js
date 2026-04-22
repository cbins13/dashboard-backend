const { getModelSchema } = require('../models/modelSchemas');

const getSchemaPrefix = () => {
    const schema = getModelSchema('Module');
    return schema ? `${schema}.` : '';
};

const runIgnoreOracleError = async (queryInterface, sql, ignoredCodes) => {
    const ignoreList = ignoredCodes.join(', ');

    await queryInterface.sequelize.query(`
        BEGIN
            EXECUTE IMMEDIATE q'~${sql}~';
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLCODE NOT IN (${ignoreList}) THEN
                    RAISE;
                END IF;
        END;
    `);
};

module.exports = {
    name: '008-seed-user-management-module',
    up: async ({ queryInterface }) => {
        const schemaPrefix = getSchemaPrefix();

        await queryInterface.sequelize.query(`
            INSERT INTO ${schemaPrefix}MODULE (CODE, NAME, ROUTE, STATUS, CREATEDON, UPDATEDON)
            SELECT 'USER_MANAGEMENT', 'User Management', '/users', 'ACTIVE', SYSTIMESTAMP, SYSTIMESTAMP
            FROM DUAL
            WHERE NOT EXISTS (
                SELECT 1 FROM ${schemaPrefix}MODULE WHERE CODE = 'USER_MANAGEMENT'
            )
        `);

        for (const [code, name, order] of [
            ['VIEW', 'View', 1],
            ['CREATE', 'Create', 2],
            ['UPDATE', 'Update', 3],
            ['DELETE', 'Delete', 4],
        ]) {
            await queryInterface.sequelize.query(`
                INSERT INTO ${schemaPrefix}MODULE_CATEGORY (MODULE_ID, CODE, NAME, SORT_ORDER, STATUS, CREATEDON, UPDATEDON)
                SELECT M.ID, '${code}', '${name}', ${order}, 'ACTIVE', SYSTIMESTAMP, SYSTIMESTAMP
                FROM ${schemaPrefix}MODULE M
                WHERE M.CODE = 'USER_MANAGEMENT'
                  AND NOT EXISTS (
                    SELECT 1 FROM ${schemaPrefix}MODULE_CATEGORY MC
                    WHERE MC.MODULE_ID = M.ID AND MC.CODE = '${code}'
                  )
            `);
        }

        await queryInterface.sequelize.query(`
            INSERT INTO ${schemaPrefix}ROLE_MODULE (ROLE_ID, MODULE_ID, CREATEDON, UPDATEDON)
            SELECT R.ID, M.ID, SYSTIMESTAMP, SYSTIMESTAMP
            FROM ${schemaPrefix}ROLE R
            CROSS JOIN ${schemaPrefix}MODULE M
            WHERE R.CODE = 'ADMINISTRATOR'
              AND M.CODE = 'USER_MANAGEMENT'
              AND NOT EXISTS (
                SELECT 1 FROM ${schemaPrefix}ROLE_MODULE RM
                WHERE RM.ROLE_ID = R.ID AND RM.MODULE_ID = M.ID
              )
        `);
    },
    down: async ({ queryInterface }) => {
        const schemaPrefix = getSchemaPrefix();

        await runIgnoreOracleError(
            queryInterface,
            `
            DELETE FROM ${schemaPrefix}ROLE_MODULE
            WHERE MODULE_ID IN (
                SELECT ID FROM ${schemaPrefix}MODULE WHERE CODE = 'USER_MANAGEMENT'
            )
        `,
            [-942]
        );

        await runIgnoreOracleError(
            queryInterface,
            `
            DELETE FROM ${schemaPrefix}MODULE_CATEGORY
            WHERE MODULE_ID IN (
                SELECT ID FROM ${schemaPrefix}MODULE WHERE CODE = 'USER_MANAGEMENT'
            )
        `,
            [-942]
        );

        await runIgnoreOracleError(
            queryInterface,
            `
            DELETE FROM ${schemaPrefix}MODULE WHERE CODE = 'USER_MANAGEMENT'
        `,
            [-942]
        );
    },
};