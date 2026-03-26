const { getModelSchema } = require('../models/modelSchemas');

const getUserRoleTableReference = () => ({
    schema: getModelSchema('UserRole') || undefined,
    tableName: 'USER_ROLE',
});

module.exports = {
    name: '006-create-user-role-table',
    up: async ({ queryInterface, Sequelize }) => {
        const { schema } = getUserRoleTableReference();
        const usersRef = schema ? `${schema}.USERS` : 'USERS';
        const roleRef = schema ? `${schema}.ROLE` : 'ROLE';

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

        const tableRef = schema ? `${schema}.USER_ROLE` : 'USER_ROLE';

        await queryInterface.sequelize.query(`
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT PK_USER_ROLE PRIMARY KEY (USER_ID, ROLE_ID)
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT FK_UR_USER FOREIGN KEY (USER_ID)
            REFERENCES ${usersRef}(ID)
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT FK_UR_ROLE FOREIGN KEY (ROLE_ID)
            REFERENCES ${roleRef}(ID)
        `);

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
        await queryInterface.sequelize.query('DROP TRIGGER TRG_USER_ROLE_TS');
        await queryInterface.dropTable(getUserRoleTableReference());
    },
};
