const { getModelSchema } = require('../models/modelSchemas');

const getRoleModuleTableReference = () => ({
    schema: getModelSchema('RoleModule') || undefined,
    tableName: 'ROLE_MODULE',
});

module.exports = {
    name: '007-create-role-module-table',
    up: async ({ queryInterface, Sequelize }) => {
        const { schema } = getRoleModuleTableReference();
        const roleRef = schema ? `${schema}.ROLE` : 'ROLE';
        const moduleRef = schema ? `${schema}.MODULE` : 'MODULE';

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

        const tableRef = schema ? `${schema}.ROLE_MODULE` : 'ROLE_MODULE';

        await queryInterface.sequelize.query(`
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT PK_ROLE_MODULE PRIMARY KEY (ROLE_ID, MODULE_ID)
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT FK_RM_ROLE FOREIGN KEY (ROLE_ID)
            REFERENCES ${roleRef}(ID)
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT FK_RM_MODULE FOREIGN KEY (MODULE_ID)
            REFERENCES ${moduleRef}(ID)
        `);

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

        await queryInterface.sequelize.query(
            `INSERT INTO ${tableRef} (ROLE_ID, MODULE_ID, CREATEDON, UPDATEDON) SELECT r.ID, m.ID, SYSTIMESTAMP, SYSTIMESTAMP FROM ${roleRef} r CROSS JOIN ${moduleRef} m WHERE r.CODE = 'ADMINISTRATOR' AND m.CODE = 'DASHBOARD'`
        );
    },
    down: async ({ queryInterface }) => {
        await queryInterface.sequelize.query('DROP TRIGGER TRG_ROLE_MODULE_TS');
        await queryInterface.dropTable(getRoleModuleTableReference());
    },
};
