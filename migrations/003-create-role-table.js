const { getModelSchema } = require('../models/modelSchemas');

const getRoleTableReference = () => ({
    schema: getModelSchema('Role') || undefined,
    tableName: 'ROLE',
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
    name: '003-create-role-table',
    up: async ({ queryInterface, Sequelize }) => {
        const { schema } = getRoleTableReference();

        await runQueryIgnoringOracleErrors(
            queryInterface,
            'CREATE SEQUENCE ROLE_SEQ START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE',
            [955]
        );

        try {
            await queryInterface.createTable(getRoleTableReference(), {
                ID: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    allowNull: false,
                },
                CODE: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                    unique: true,
                },
                NAME: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                },
                STATUS: {
                    type: Sequelize.STRING(20),
                    allowNull: false,
                    defaultValue: 'ACTIVE',
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

        const tableRef = schema ? `${schema}.ROLE` : 'ROLE';

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_ROLE_ID
            BEFORE INSERT ON ${tableRef}
            FOR EACH ROW
            BEGIN
                IF :NEW.ID IS NULL THEN
                    :NEW.ID := ROLE_SEQ.NEXTVAL;
                END IF;
            END;
        `);

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_ROLE_TS
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
            `
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT CHK_ROLE_STATUS CHECK (STATUS IN ('ACTIVE', 'INACTIVE'))
        `,
            [2264]
        );

        await runQueryIgnoringOracleErrors(
            queryInterface,
            `INSERT INTO ${tableRef} (CODE, NAME, STATUS, CREATEDON, UPDATEDON) VALUES ('ADMINISTRATOR', 'Administrator', 'ACTIVE', SYSTIMESTAMP, SYSTIMESTAMP)`,
            [1]
        );
    },
    down: async ({ queryInterface }) => {
        await runQueryIgnoringOracleErrors(queryInterface, 'DROP TRIGGER TRG_ROLE_TS', [4080]);
        await runQueryIgnoringOracleErrors(queryInterface, 'DROP TRIGGER TRG_ROLE_ID', [4080]);
        try {
            await queryInterface.dropTable(getRoleTableReference());
        } catch (error) {
            if (!shouldIgnoreOracleError(error, [942])) {
                throw error;
            }
        }
        await runQueryIgnoringOracleErrors(queryInterface, 'DROP SEQUENCE ROLE_SEQ', [2289]);
    },
};
