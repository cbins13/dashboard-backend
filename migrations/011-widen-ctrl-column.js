'use strict';

const { getModelSchema } = require('../models/modelSchemas');

const getSchemaPrefix = (modelName) => {
    const schema = getModelSchema(modelName);
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
    name: '011-widen-ctrl-column',
    up: async ({ queryInterface }) => {
        const roleModuleSchemaPrefix = getSchemaPrefix('RoleModule');
        const roleModuleTableRef = `${roleModuleSchemaPrefix}ROLE_MODULE`;

        // 1. Drop the old single-value CHECK constraint
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${roleModuleTableRef} DROP CONSTRAINT CHK_RM_CTRL`,
            [-2443, -2444]
        );

        // 2. Widen CTRL column to hold comma-separated values (e.g. "VIEW,CREATE,EDIT,DELETE")
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${roleModuleTableRef} MODIFY CTRL VARCHAR2(100)`,
            [-1442]
        );
    },

    down: async ({ queryInterface }) => {
        const roleModuleSchemaPrefix = getSchemaPrefix('RoleModule');
        const roleModuleTableRef = `${roleModuleSchemaPrefix}ROLE_MODULE`;

        // Restore original CHECK constraint and column width
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${roleModuleTableRef} MODIFY CTRL VARCHAR2(20)`,
            [-1442]
        );

        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${roleModuleTableRef} ADD CONSTRAINT CHK_RM_CTRL CHECK (CTRL IN ('VIEW','CREATE','EDIT','DELETE'))`,
            [-2264]
        );
    },
};
