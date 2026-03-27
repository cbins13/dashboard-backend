const { getModelSchema } = require('../models/modelSchemas');

const getSchemaPrefix = (modelName) => {
    const schema = getModelSchema(modelName);
    return schema ? `${schema}.` : '';
};

const getModuleTableReference = () => ({
    schema: getModelSchema('Module') || undefined,
    tableName: 'MODULE',
});

const runIgnoreOracleError = async (queryInterface, sql, ignoredCodes) => {
    const ignoreList = ignoredCodes.join(', ');

    await queryInterface.sequelize.query(`
        BEGIN
            EXECUTE IMMEDIATE q'~${sql}~';
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLCODE NOT IN (${ignoreList}) THEN
                    RAISE;
                END IF;
        END;
    `);
};

module.exports = {
    name: '009-restructure-module-category-hierarchy',
    up: async ({ queryInterface, Sequelize }) => {
        const moduleSchemaPrefix = getSchemaPrefix('Module');
        const categorySchemaPrefix = getSchemaPrefix('ModuleCategory');
        const roleSchemaPrefix = getSchemaPrefix('Role');
        const roleModuleCategorySchemaPrefix = getSchemaPrefix('RoleModuleCategory');
        const moduleTableRef = `${moduleSchemaPrefix}MODULE`;
        const categoryTableRef = `${categorySchemaPrefix}MODULE_CATEGORY_BASE`;
        const roleTableRef = `${roleSchemaPrefix}ROLE`;
        const roleModuleCategoryTableRef = `${roleModuleCategorySchemaPrefix}ROLE_MODULE_CATEGORY`;

        await runIgnoreOracleError(
            queryInterface,
            'DROP TRIGGER TRG_RMC_TS',
            [-4080]
        );
        await runIgnoreOracleError(
            queryInterface,
            `DROP TABLE ${roleModuleCategoryTableRef}`,
            [-942]
        );
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${moduleTableRef} DROP CONSTRAINT FK_MOD_MCB`,
            [-2443, -2444]
        );
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${moduleTableRef} DROP COLUMN MODULE_CATEGORY_ID`,
            [-904]
        );
        await runIgnoreOracleError(
            queryInterface,
            'DROP TRIGGER TRG_MCB_TS',
            [-4080]
        );
        await runIgnoreOracleError(
            queryInterface,
            'DROP TRIGGER TRG_MCB_ID',
            [-4080]
        );
        await runIgnoreOracleError(
            queryInterface,
            `DROP TABLE ${categoryTableRef}`,
            [-942]
        );
        await runIgnoreOracleError(
            queryInterface,
            'DROP SEQUENCE MODULE_CATEGORY_BASE_SEQ',
            [-2289]
        );

        await queryInterface.sequelize.query(
            'CREATE SEQUENCE MODULE_CATEGORY_BASE_SEQ START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE'
        );

        await queryInterface.createTable(
            {
                schema: getModelSchema('ModuleCategory') || undefined,
                tableName: 'MODULE_CATEGORY_BASE',
            },
            {
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
            }
        );

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_MCB_ID
            BEFORE INSERT ON ${categoryTableRef}
            FOR EACH ROW
            BEGIN
                IF :NEW.ID IS NULL THEN
                    :NEW.ID := MODULE_CATEGORY_BASE_SEQ.NEXTVAL;
                END IF;
            END;
        `);

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_MCB_TS
            BEFORE INSERT OR UPDATE ON ${categoryTableRef}
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
            ALTER TABLE ${categoryTableRef}
            ADD CONSTRAINT CHK_MCB_STATUS CHECK (STATUS IN ('ACTIVE', 'INACTIVE'))
        `);

        await queryInterface.addColumn(getModuleTableReference(), 'MODULE_CATEGORY_ID', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });

        await queryInterface.sequelize.query(`
            ALTER TABLE ${moduleTableRef}
            ADD CONSTRAINT FK_MOD_MCB FOREIGN KEY (MODULE_CATEGORY_ID)
            REFERENCES ${categoryTableRef}(ID)
        `);

        for (const [code, name, sortOrder] of [
            ['DASHBOARD', 'Dashboard', 1],
            ['USER_MANAGEMENT', 'User Management', 2],
        ]) {
            await queryInterface.sequelize.query(`
                INSERT INTO ${categoryTableRef} (CODE, NAME, SORT_ORDER, STATUS, CREATEDON, UPDATEDON)
                SELECT '${code}', '${name}', ${sortOrder}, 'ACTIVE', SYSTIMESTAMP, SYSTIMESTAMP
                FROM DUAL
                WHERE NOT EXISTS (
                    SELECT 1 FROM ${categoryTableRef} WHERE CODE = '${code}'
                )
            `);
        }

        await queryInterface.sequelize.query(`
            UPDATE ${moduleTableRef}
            SET MODULE_CATEGORY_ID = (
                SELECT ID FROM ${categoryTableRef} WHERE CODE = 'DASHBOARD'
            )
            WHERE CODE = 'DASHBOARD'
        `);

        await queryInterface.sequelize.query(`
            UPDATE ${moduleTableRef}
            SET ROUTE = '/user-management',
                MODULE_CATEGORY_ID = (
                    SELECT ID FROM ${categoryTableRef} WHERE CODE = 'USER_MANAGEMENT'
                )
            WHERE CODE = 'USER_MANAGEMENT'
        `);

        for (const [code, name, route, categoryCode] of [
            ['HOME', 'Home', '/dashboard/home', 'DASHBOARD'],
            ['USERS', 'Users', '/user-management/users', 'USER_MANAGEMENT'],
            ['ROLES', 'Roles', '/user-management/roles', 'USER_MANAGEMENT'],
            ['MODULES', 'Modules', '/user-management/modules', 'USER_MANAGEMENT'],
        ]) {
            await queryInterface.sequelize.query(`
                INSERT INTO ${moduleTableRef} (CODE, NAME, ROUTE, MODULE_CATEGORY_ID, STATUS, CREATEDON, UPDATEDON)
                SELECT '${code}', '${name}', '${route}',
                       (SELECT ID FROM ${categoryTableRef} WHERE CODE = '${categoryCode}'),
                       'ACTIVE', SYSTIMESTAMP, SYSTIMESTAMP
                FROM DUAL
                WHERE NOT EXISTS (
                    SELECT 1 FROM ${moduleTableRef} WHERE CODE = '${code}'
                )
            `);
        }

        await queryInterface.createTable(
            {
                schema: getModelSchema('RoleModuleCategory') || undefined,
                tableName: 'ROLE_MODULE_CATEGORY',
            },
            {
                ROLE_ID: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                MODULE_CATEGORY_ID: {
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
            }
        );

        await queryInterface.sequelize.query(`
            ALTER TABLE ${roleModuleCategoryTableRef}
            ADD CONSTRAINT PK_RMC PRIMARY KEY (ROLE_ID, MODULE_CATEGORY_ID)
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE ${roleModuleCategoryTableRef}
            ADD CONSTRAINT FK_RMC_ROLE FOREIGN KEY (ROLE_ID)
            REFERENCES ${roleTableRef}(ID)
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE ${roleModuleCategoryTableRef}
            ADD CONSTRAINT FK_RMC_MCB FOREIGN KEY (MODULE_CATEGORY_ID)
            REFERENCES ${categoryTableRef}(ID)
        `);

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_RMC_TS
            BEFORE INSERT OR UPDATE ON ${roleModuleCategoryTableRef}
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
            INSERT INTO ${roleModuleCategoryTableRef} (ROLE_ID, MODULE_CATEGORY_ID, CREATEDON, UPDATEDON)
            SELECT R.ID, MCB.ID, SYSTIMESTAMP, SYSTIMESTAMP
            FROM ${roleTableRef} R
            CROSS JOIN ${categoryTableRef} MCB
            WHERE R.CODE = 'ADMINISTRATOR'
              AND MCB.CODE IN ('DASHBOARD', 'USER_MANAGEMENT')
              AND NOT EXISTS (
                SELECT 1
                FROM ${roleModuleCategoryTableRef} RMC
                WHERE RMC.ROLE_ID = R.ID
                  AND RMC.MODULE_CATEGORY_ID = MCB.ID
              )
        `);
    },
    down: async ({ queryInterface }) => {
        const moduleSchemaPrefix = getSchemaPrefix('Module');
        const moduleTableRef = `${moduleSchemaPrefix}MODULE`;

        await queryInterface.sequelize.query(`
            DELETE FROM ${moduleTableRef}
            WHERE CODE IN ('HOME', 'USERS', 'ROLES', 'MODULES')
        `);

        await queryInterface.sequelize.query('DROP TRIGGER TRG_RMC_TS');
        await queryInterface.dropTable({
            schema: getModelSchema('RoleModuleCategory') || undefined,
            tableName: 'ROLE_MODULE_CATEGORY',
        });

        await queryInterface.sequelize.query(`
            ALTER TABLE ${moduleTableRef}
            DROP CONSTRAINT FK_MOD_MCB
        `);
        await queryInterface.removeColumn(getModuleTableReference(), 'MODULE_CATEGORY_ID');

        await queryInterface.sequelize.query('DROP TRIGGER TRG_MCB_TS');
        await queryInterface.sequelize.query('DROP TRIGGER TRG_MCB_ID');
        await queryInterface.dropTable({
            schema: getModelSchema('ModuleCategory') || undefined,
            tableName: 'MODULE_CATEGORY_BASE',
        });
        await queryInterface.sequelize.query('DROP SEQUENCE MODULE_CATEGORY_BASE_SEQ');
    },
};