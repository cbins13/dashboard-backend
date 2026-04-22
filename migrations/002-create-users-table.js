const { getModelSchema } = require('../models/modelSchemas');

const getUsersTableReference = () => {
    return {
        schema: getModelSchema('Users') || undefined,
        tableName: 'USERS',
    };
};

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
    name: '002-create-users-table',
    up: async ({ queryInterface, Sequelize }) => {
        const { schema } = getUsersTableReference();

        await runQueryIgnoringOracleErrors(
            queryInterface,
            'CREATE SEQUENCE users_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE',
            [955]
        );

        try {
            await queryInterface.createTable(getUsersTableReference(), {
                ID: {
                    type: Sequelize.NUMBER,
                    primaryKey: true,
                    allowNull: false,
                },
                USERNAME: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                    unique: true,
                },
                PASSWORD: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                },
                DISPLAYNAME: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                },
                USERSTATUS: {
                    type: Sequelize.STRING(20),
                    allowNull: false,
                    defaultValue: 'ACTIVE',
                },
                ARCHIVED: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
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

        const tableRef = schema ? `${schema}.USERS` : 'USERS';

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER trg_users_id
            BEFORE INSERT ON ${tableRef}
            FOR EACH ROW
            BEGIN
                IF :NEW.ID IS NULL THEN
                    :NEW.ID := users_seq.NEXTVAL;
                END IF;
            END;
        `);

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER trg_users_timestamps
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
            ADD CONSTRAINT chk_users_status CHECK (USERSTATUS IN ('ACTIVE', 'INACTIVE'))
        `,
            [2264]
        );

        await runQueryIgnoringOracleErrors(
            queryInterface,
            `
            ALTER TABLE ${tableRef}
            ADD CONSTRAINT chk_users_archived CHECK (ARCHIVED IN (0, 1))
        `,
            [2264]
        );
    },
    down: async ({ queryInterface }) => {
        await runQueryIgnoringOracleErrors(
            queryInterface,
            `DROP TRIGGER trg_users_timestamps`,
            [4080]
        );
        await runQueryIgnoringOracleErrors(
            queryInterface,
            `DROP TRIGGER trg_users_id`,
            [4080]
        );
        await queryInterface.dropTable(getUsersTableReference());
        await runQueryIgnoringOracleErrors(
            queryInterface,
            `DROP SEQUENCE users_seq`,
            [2289]
        );
    },
};
