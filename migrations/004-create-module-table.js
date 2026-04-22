const { getModelSchema } = require('../models/modelSchemas');

const getModuleTableReference = () => ({
    schema: getModelSchema('Module') || undefined,
    tableName: 'MODULE',
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
    name: '004-create-module-table',
    up: async ({ queryInterface, Sequelize }) => {
        const { schema } = getModuleTableReference();

        await runQueryIgnoringOracleErrors(
            queryInterface,
            'CREATE SEQUENCE MODULE_SEQ START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE',
            [955]
        );

        try {
            await queryInterface.createTable(getModuleTableReference(), {
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
                ROUTE: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
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

        const tableRef = schema ? `${schema}.MODULE` : 'MODULE';

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_MODULE_ID
            BEFORE INSERT ON ${tableRef}
            FOR EACH ROW
            BEGIN
                IF :NEW.ID IS NULL THEN
                    :NEW.ID := MODULE_SEQ.NEXTVAL;
                END IF;
            END;
        `);

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_MODULE_TS
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
            ADD CONSTRAINT CHK_MODULE_STATUS CHECK (STATUS IN ('ACTIVE', 'INACTIVE'))
        `,
            [2264]
        );

        await runQueryIgnoringOracleErrors(
            queryInterface,
            `INSERT INTO ${tableRef} (CODE, NAME, ROUTE, STATUS, CREATEDON, UPDATEDON) VALUES ('DASHBOARD', 'Dashboard', '/dashboard', 'ACTIVE', SYSTIMESTAMP, SYSTIMESTAMP)`,
            [1]
        );
    },
    down: async ({ queryInterface }) => {
        await runQueryIgnoringOracleErrors(queryInterface, 'DROP TRIGGER TRG_MODULE_TS', [4080]);
        await runQueryIgnoringOracleErrors(queryInterface, 'DROP TRIGGER TRG_MODULE_ID', [4080]);
        try {
            await queryInterface.dropTable(getModuleTableReference());
        } catch (error) {
            if (!shouldIgnoreOracleError(error, [942])) {
                throw error;
            }
        }
        await runQueryIgnoringOracleErrors(queryInterface, 'DROP SEQUENCE MODULE_SEQ', [2289]);
    },
};
