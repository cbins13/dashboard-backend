const { getModelSchema } = require('../models/modelSchemas');

const getUsersTableReference = () => {
    return {
        schema: getModelSchema('Users') || undefined,
        tableName: 'USERS',
    };
};

module.exports = {
    name: '002-create-users-table',
    up: async ({ queryInterface, Sequelize }) => {
        const { schema } = getUsersTableReference();

        await queryInterface.sequelize.query(
            'CREATE SEQUENCE users_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE'
        );

        await queryInterface.createTable(getUsersTableReference(), {
            id: {
                type: Sequelize.NUMBER,
                primaryKey: true,
                allowNull: false,
            },
            username: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            password: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            displayname: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            userstatus: {
                type: Sequelize.STRING(20),
                allowNull: false,
                defaultValue: 'ACTIVE',
            },
            archived: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            createdon: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedon: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        });

        const tableRef = schema ? `${schema}.USERS` : 'USERS';

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER trg_users_id
            BEFORE INSERT ON ${tableRef}
            FOR EACH ROW
            BEGIN
                IF :NEW.id IS NULL THEN
                    :NEW.id := users_seq.NEXTVAL;
                END IF;
            END;
        `);

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER trg_users_timestamps
            BEFORE INSERT OR UPDATE ON ${tableRef}
            FOR EACH ROW
            BEGIN
                IF INSERTING THEN
                    :NEW.createdon := SYSTIMESTAMP;
                    :NEW.updatedon := SYSTIMESTAMP;
                ELSIF UPDATING THEN
                    :NEW.updatedon := SYSTIMESTAMP;
                END IF;
            END;
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT chk_users_status CHECK (userstatus IN ('ACTIVE', 'INACTIVE'))
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT chk_users_archived CHECK (archived IN (0, 1))
        `);
    },
    down: async ({ queryInterface }) => {
        await queryInterface.sequelize.query(`DROP TRIGGER trg_users_timestamps`);
        await queryInterface.sequelize.query(`DROP TRIGGER trg_users_id`);
        await queryInterface.dropTable(getUsersTableReference());
        await queryInterface.sequelize.query(`DROP SEQUENCE users_seq`);
    },
};
