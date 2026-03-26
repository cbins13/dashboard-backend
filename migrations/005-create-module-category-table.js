const { getModelSchema } = require('../models/modelSchemas');

const getModuleCategoryTableReference = () => ({
    schema: getModelSchema('ModuleCategory') || undefined,
    tableName: 'MODULE_CATEGORY',
});

module.exports = {
    name: '005-create-module-category-table',
    up: async ({ queryInterface, Sequelize }) => {
        const { schema } = getModuleCategoryTableReference();
        const moduleTableRef = schema ? `${schema}.MODULE` : 'MODULE';

        await queryInterface.sequelize.query(
            'CREATE SEQUENCE MODULE_CAT_SEQ START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE'
        );

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

        const tableRef = schema ? `${schema}.MODULE_CATEGORY` : 'MODULE_CATEGORY';

        await queryInterface.sequelize.query(`
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT FK_MC_MODULE FOREIGN KEY (MODULE_ID)
            REFERENCES ${moduleTableRef}(ID)
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT UQ_MC_MODULE_CODE UNIQUE (MODULE_ID, CODE)
        `);

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

        await queryInterface.sequelize.query(`
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT CHK_MC_STATUS CHECK (STATUS IN ('ACTIVE', 'INACTIVE'))
        `);

        await queryInterface.sequelize.query(
            `INSERT INTO ${tableRef} (MODULE_ID, CODE, NAME, SORT_ORDER, STATUS, CREATEDON, UPDATEDON) SELECT ID, 'HOME', 'Home', 1, 'ACTIVE', SYSTIMESTAMP, SYSTIMESTAMP FROM ${moduleTableRef} WHERE CODE = 'DASHBOARD'`
        );
    },
    down: async ({ queryInterface }) => {
        await queryInterface.sequelize.query('DROP TRIGGER TRG_MODCAT_TS');
        await queryInterface.sequelize.query('DROP TRIGGER TRG_MODCAT_ID');
        await queryInterface.dropTable(getModuleCategoryTableReference());
        await queryInterface.sequelize.query('DROP SEQUENCE MODULE_CAT_SEQ');
    },
};
