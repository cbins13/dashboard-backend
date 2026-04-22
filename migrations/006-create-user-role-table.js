const { getModelSchema } = require('../models/modelSchemas');

const getUserRoleTableReference = () => ({
    schema: getModelSchema('UserRole') || undefined,
    tableName: 'USER_ROLE',
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
    name: '006-create-user-role-table',
    up: async ({ queryInterface, Sequelize }) => {
        const { schema } = getUserRoleTableReference();
        const usersRef = schema ? `${schema}.USERS` : 'USERS';
        const roleRef = schema ? `${schema}.ROLE` : 'ROLE';

        try {
            await queryInterface.createTable(getUserRoleTableReference(), {
                USER_ID: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                ROLE_ID: {
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

        const tableRef = schema ? `${schema}.USER_ROLE` : 'USER_ROLE';

        await runQueryIgnoringOracleErrors(
            queryInterface,
            `
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT PK_USER_ROLE PRIMARY KEY (USER_ID, ROLE_ID)
        `,
            [2264]
        );

        await runQueryIgnoringOracleErrors(
            queryInterface,
            `
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT FK_UR_USER FOREIGN KEY (USER_ID)
            REFERENCES ${usersRef}(ID)
        `,
            [2264, 2275]
        );

        await runQueryIgnoringOracleErrors(
            queryInterface,
            `
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT FK_UR_ROLE FOREIGN KEY (ROLE_ID)
            REFERENCES ${roleRef}(ID)
        `,
            [2264, 2275]
        );

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_USER_ROLE_TS
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
    },
    down: async ({ queryInterface }) => {
        await runQueryIgnoringOracleErrors(queryInterface, 'DROP TRIGGER TRG_USER_ROLE_TS', [4080]);
        try {
            await queryInterface.dropTable(getUserRoleTableReference());
        } catch (error) {
            if (!shouldIgnoreOracleError(error, [942])) {
                throw error;
            }
        }
    },
};
