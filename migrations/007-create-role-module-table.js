const { getModelSchema } = require('../models/modelSchemas');

const getRoleModuleTableReference = () => ({
    schema: getModelSchema('RoleModule') || undefined,
    tableName: 'ROLE_MODULE',
});

const getOracleErrorCode = (error) => {
    const match = error?.message?.match(/ORA-(\d+)/i);
    return match ? Number(match[1]) : null;
};

const shouldIgnoreOracleError = (error, ignoreCodes) => {
    const code = getOracleErrorCode(error);
    return code ? ignoreCodes.includes(code) : false;
};

const runQueryIgnoringOracleErrors = async (queryInterface, sql, ignoreCodes) => {
    try {
        await queryInterface.sequelize.query(sql);
    } catch (error) {
        if (!shouldIgnoreOracleError(error, ignoreCodes)) {
            throw error;
        }
    }
};

module.exports = {
    name: '007-create-role-module-table',
    up: async ({ queryInterface, Sequelize }) => {
        const { schema } = getRoleModuleTableReference();
        const roleRef = schema ? `${schema}.ROLE` : 'ROLE';
        const moduleRef = schema ? `${schema}.MODULE` : 'MODULE';

        try {
            await queryInterface.createTable(getRoleModuleTableReference(), {
                ROLE_ID: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                MODULE_ID: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                CREATEDON: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                UPDATEDON: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
            });
        } catch (error) {
            if (!shouldIgnoreOracleError(error, [955])) {
                throw error;
            }
        }

        const tableRef = schema ? `${schema}.ROLE_MODULE` : 'ROLE_MODULE';

        await runQueryIgnoringOracleErrors(
            queryInterface,
            `
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT PK_ROLE_MODULE PRIMARY KEY (ROLE_ID, MODULE_ID)
        `,
            [2264]
        );

        await runQueryIgnoringOracleErrors(
            queryInterface,
            `
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT FK_RM_ROLE FOREIGN KEY (ROLE_ID)
            REFERENCES ${roleRef}(ID)
        `,
            [2264, 2275]
        );

        await runQueryIgnoringOracleErrors(
            queryInterface,
            `
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT FK_RM_MODULE FOREIGN KEY (MODULE_ID)
            REFERENCES ${moduleRef}(ID)
        `,
            [2264, 2275]
        );

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_ROLE_MODULE_TS
            BEFORE INSERT OR UPDATE ON ${tableRef}
            FOR EACH ROW
            BEGIN
                IF INSERTING THEN
                    :NEW.CREATEDON := SYSTIMESTAMP;
                    :NEW.UPDATEDON := SYSTIMESTAMP;
                ELSIF UPDATING THEN
                    :NEW.UPDATEDON := SYSTIMESTAMP;
                END IF;
            END;
        `);

        await runQueryIgnoringOracleErrors(
            queryInterface,
            `INSERT INTO ${tableRef} (ROLE_ID, MODULE_ID, CREATEDON, UPDATEDON) SELECT r.ID, m.ID, SYSTIMESTAMP, SYSTIMESTAMP FROM ${roleRef} r CROSS JOIN ${moduleRef} m WHERE r.CODE = 'ADMINISTRATOR' AND m.CODE = 'DASHBOARD'`,
            [1]
        );
    },
    down: async ({ queryInterface }) => {
        await runQueryIgnoringOracleErrors(queryInterface, 'DROP TRIGGER TRG_ROLE_MODULE_TS', [4080]);
        try {
            await queryInterface.dropTable(getRoleModuleTableReference());
        } catch (error) {
            if (!shouldIgnoreOracleError(error, [942])) {
                throw error;
            }
        }
    },
};
