const { getModelSchema } = require('../models/modelSchemas');

const getRoleTableReference = () => ({
    schema: getModelSchema('Role') || undefined,
    tableName: 'ROLE',
});

module.exports = {
    name: '003-create-role-table',
    up: async ({ queryInterface, Sequelize }) => {
        const { schema } = getRoleTableReference();

        await queryInterface.sequelize.query(
            'CREATE SEQUENCE ROLE_SEQ START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE'
        );

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

        await queryInterface.sequelize.query(`
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT CHK_ROLE_STATUS CHECK (STATUS IN ('ACTIVE', 'INACTIVE'))
        `);

        await queryInterface.sequelize.query(
            `INSERT INTO ${tableRef} (CODE, NAME, STATUS, CREATEDON, UPDATEDON) VALUES ('ADMINISTRATOR', 'Administrator', 'ACTIVE', SYSTIMESTAMP, SYSTIMESTAMP)`
        );
    },
    down: async ({ queryInterface }) => {
        await queryInterface.sequelize.query('DROP TRIGGER TRG_ROLE_TS');
        await queryInterface.sequelize.query('DROP TRIGGER TRG_ROLE_ID');
        await queryInterface.dropTable(getRoleTableReference());
        await queryInterface.sequelize.query('DROP SEQUENCE ROLE_SEQ');
    },
};
