const { getModelSchema } = require('../models/modelSchemas');

const getModuleCategoryTableReference = () => ({
    schema: getModelSchema('ModuleCategory') || undefined,
    tableName: 'MODULE_CATEGORY',
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
    name: '005-create-module-category-table',
    up: async ({ queryInterface, Sequelize }) => {
        const { schema } = getModuleCategoryTableReference();
        const moduleTableRef = schema ? `${schema}.MODULE` : 'MODULE';

        await runQueryIgnoringOracleErrors(
            queryInterface,
            'CREATE SEQUENCE MODULE_CAT_SEQ START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE',
            [955]
        );

        try {
            await queryInterface.createTable(getModuleCategoryTableReference(), {
                ID: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    allowNull: false,
                },
                MODULE_ID: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                CODE: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                },
                NAME: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                },
                SORT_ORDER: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 1,
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

        const tableRef = schema ? `${schema}.MODULE_CATEGORY` : 'MODULE_CATEGORY';

        await runQueryIgnoringOracleErrors(
            queryInterface,
            `
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT FK_MC_MODULE FOREIGN KEY (MODULE_ID)
            REFERENCES ${moduleTableRef}(ID)
        `,
            [2264, 2275]
        );

        await runQueryIgnoringOracleErrors(
            queryInterface,
            `
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT UQ_MC_MODULE_CODE UNIQUE (MODULE_ID, CODE)
        `,
            [2264]
        );

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_MODCAT_ID
            BEFORE INSERT ON ${tableRef}
            FOR EACH ROW
            BEGIN
                IF :NEW.ID IS NULL THEN
                    :NEW.ID := MODULE_CAT_SEQ.NEXTVAL;
                END IF;
            END;
        `);

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_MODCAT_TS
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
            ADD CONSTRAINT CHK_MC_STATUS CHECK (STATUS IN ('ACTIVE', 'INACTIVE'))
        `,
            [2264]
        );

        await runQueryIgnoringOracleErrors(
            queryInterface,
            `INSERT INTO ${tableRef} (MODULE_ID, CODE, NAME, SORT_ORDER, STATUS, CREATEDON, UPDATEDON) SELECT ID, 'HOME', 'Home', 1, 'ACTIVE', SYSTIMESTAMP, SYSTIMESTAMP FROM ${moduleTableRef} WHERE CODE = 'DASHBOARD'`,
            [1]
        );
    },
    down: async ({ queryInterface }) => {
        await runQueryIgnoringOracleErrors(queryInterface, 'DROP TRIGGER TRG_MODCAT_TS', [4080]);
        await runQueryIgnoringOracleErrors(queryInterface, 'DROP TRIGGER TRG_MODCAT_ID', [4080]);
        try {
            await queryInterface.dropTable(getModuleCategoryTableReference());
        } catch (error) {
            if (!shouldIgnoreOracleError(error, [942])) {
                throw error;
            }
        }
        await runQueryIgnoringOracleErrors(queryInterface, 'DROP SEQUENCE MODULE_CAT_SEQ', [2289]);
    },
};
