'use strict';

const { getModelSchema } = require('../models/modelSchemas');

const getSchemaPrefix = (modelName) => {
    const schema = getModelSchema(modelName);
    return schema ? `${schema}.` : '';
};

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
    name: '010-drop-rmc-rename-mc-add-ctrl',
    up: async ({ queryInterface }) => {
        const roleSchemaPrefix = getSchemaPrefix('Role');
        const moduleCategorySchemaPrefix = getSchemaPrefix('ModuleCategory');
        const moduleSchemaPrefix = getSchemaPrefix('Module');
        const roleModuleSchemaPrefix = getSchemaPrefix('RoleModule');

        const roleTableRef = `${roleSchemaPrefix}ROLE`;
        const moduleTableRef = `${moduleSchemaPrefix}MODULE`;
        const roleModuleTableRef = `${roleModuleSchemaPrefix}ROLE_MODULE`;
        const oldCategoryTableRef = `${moduleCategorySchemaPrefix}MODULE_CATEGORY_BASE`;
        const newCategoryTableRef = `${moduleCategorySchemaPrefix}MODULE_CATEGORY`;

        // 0. Drop legacy MODULE_CATEGORY table (migration 005) — its name collides with our rename target
        //    Oracle drops associated triggers (TRG_MODCAT_ID, TRG_MODCAT_TS) automatically with the table.
        await runIgnoreOracleError(
            queryInterface,
            `DROP TABLE ${moduleCategorySchemaPrefix}MODULE_CATEGORY`,
            [-942]
        );
        await runIgnoreOracleError(queryInterface, 'DROP SEQUENCE MODULE_CAT_SEQ', [-2289]);

        // 1. Drop ROLE_MODULE_CATEGORY trigger and table
        await runIgnoreOracleError(queryInterface, 'DROP TRIGGER TRG_RMC_TS', [-4080]);
        await runIgnoreOracleError(
            queryInterface,
            `DROP TABLE ${moduleCategorySchemaPrefix}ROLE_MODULE_CATEGORY`,
            [-942]
        );

        // 2. Drop FK from MODULE that references MODULE_CATEGORY_BASE
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${moduleTableRef} DROP CONSTRAINT FK_MOD_MCB`,
            [-2443, -2444]
        );

        // 3. Drop old triggers on MODULE_CATEGORY_BASE before renaming
        await runIgnoreOracleError(queryInterface, 'DROP TRIGGER TRG_MCB_TS', [-4080]);
        await runIgnoreOracleError(queryInterface, 'DROP TRIGGER TRG_MCB_ID', [-4080]);

        // 4. Rename MODULE_CATEGORY_BASE → MODULE_CATEGORY
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${oldCategoryTableRef} RENAME TO MODULE_CATEGORY`,
            [-903, -942]
        );

        // 5. Re-add FK from MODULE.MODULE_CATEGORY_ID → MODULE_CATEGORY.ID
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${moduleTableRef} ADD CONSTRAINT FK_MOD_MC FOREIGN KEY (MODULE_CATEGORY_ID) REFERENCES ${newCategoryTableRef}(ID)`,
            [-2264]
        );

        // 6. Recreate triggers on the renamed table MODULE_CATEGORY
        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_MC_ID
            BEFORE INSERT ON ${newCategoryTableRef}
            FOR EACH ROW
            BEGIN
                IF :NEW.ID IS NULL THEN
                    :NEW.ID := MODULE_CATEGORY_BASE_SEQ.NEXTVAL;
                END IF;
            END;
        `);

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_MC_TS
            BEFORE INSERT OR UPDATE ON ${newCategoryTableRef}
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

        // 7. Add CTRL column (nullable first so existing rows are unaffected)
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${roleModuleTableRef} ADD CTRL VARCHAR2(20)`,
            [-1430]
        );

        // 8. Set existing rows to VIEW
        await queryInterface.sequelize.query(
            `UPDATE ${roleModuleTableRef} SET CTRL = 'VIEW' WHERE CTRL IS NULL`
        );

        // 9. Add CHECK constraint
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${roleModuleTableRef} ADD CONSTRAINT CHK_RM_CTRL CHECK (CTRL IN ('VIEW','CREATE','EDIT','DELETE'))`,
            [-2264]
        );

        // 10. Make CTRL NOT NULL
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${roleModuleTableRef} MODIFY CTRL NOT NULL`,
            [-1451]
        );

        // 11. Remove old seeds: ADMINISTRATOR role linked to DASHBOARD and USER_MANAGEMENT modules
        await queryInterface.sequelize.query(`
            DELETE FROM ${roleModuleTableRef}
            WHERE ROLE_ID = (SELECT ID FROM ${roleTableRef} WHERE CODE = 'ADMINISTRATOR')
              AND MODULE_ID IN (
                  SELECT ID FROM ${moduleTableRef} WHERE CODE IN ('DASHBOARD', 'USER_MANAGEMENT')
              )
        `);

        // 12. Insert new seeds: ADMINISTRATOR → HOME, USERS, ROLES, MODULES with CTRL='VIEW'
        await queryInterface.sequelize.query(`
            INSERT INTO ${roleModuleTableRef} (ROLE_ID, MODULE_ID, CTRL, CREATEDON, UPDATEDON)
            SELECT R.ID, M.ID, 'VIEW', SYSTIMESTAMP, SYSTIMESTAMP
            FROM ${roleTableRef} R
            CROSS JOIN ${moduleTableRef} M
            WHERE R.CODE = 'ADMINISTRATOR'
              AND M.CODE IN ('HOME', 'USERS', 'ROLES', 'MODULES')
              AND NOT EXISTS (
                  SELECT 1
                  FROM ${roleModuleTableRef} RM
                  WHERE RM.ROLE_ID = R.ID
                    AND RM.MODULE_ID = M.ID
              )
        `);
    },

    down: async ({ queryInterface, Sequelize }) => {
        const roleSchemaPrefix = getSchemaPrefix('Role');
        const moduleCategorySchemaPrefix = getSchemaPrefix('ModuleCategory');
        const moduleSchemaPrefix = getSchemaPrefix('Module');
        const roleModuleSchemaPrefix = getSchemaPrefix('RoleModule');

        const roleTableRef = `${roleSchemaPrefix}ROLE`;
        const moduleTableRef = `${moduleSchemaPrefix}MODULE`;
        const roleModuleTableRef = `${roleModuleSchemaPrefix}ROLE_MODULE`;
        const oldCategoryTableRef = `${moduleCategorySchemaPrefix}MODULE_CATEGORY_BASE`;
        const newCategoryTableRef = `${moduleCategorySchemaPrefix}MODULE_CATEGORY`;

        // Remove new seeds
        await queryInterface.sequelize.query(`
            DELETE FROM ${roleModuleTableRef}
            WHERE MODULE_ID IN (
                SELECT ID FROM ${moduleTableRef} WHERE CODE IN ('HOME', 'USERS', 'ROLES', 'MODULES')
            )
        `);

        // Remove CTRL NOT NULL + constraint + column
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${roleModuleTableRef} DROP CONSTRAINT CHK_RM_CTRL`,
            [-2443, -2444]
        );
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${roleModuleTableRef} DROP COLUMN CTRL`,
            [-904]
        );

        // Drop FK from MODULE referencing MODULE_CATEGORY (new name)
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${moduleTableRef} DROP CONSTRAINT FK_MOD_MC`,
            [-2443, -2444]
        );

        // Drop triggers on MODULE_CATEGORY before renaming back
        await runIgnoreOracleError(queryInterface, 'DROP TRIGGER TRG_MC_TS', [-4080]);
        await runIgnoreOracleError(queryInterface, 'DROP TRIGGER TRG_MC_ID', [-4080]);

        // Rename MODULE_CATEGORY back to MODULE_CATEGORY_BASE
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${newCategoryTableRef} RENAME TO MODULE_CATEGORY_BASE`,
            [-903, -942]
        );

        // Re-add FK from MODULE → MODULE_CATEGORY_BASE
        await runIgnoreOracleError(
            queryInterface,
            `ALTER TABLE ${moduleTableRef} ADD CONSTRAINT FK_MOD_MCB FOREIGN KEY (MODULE_CATEGORY_ID) REFERENCES ${oldCategoryTableRef}(ID)`,
            [-2264]
        );

        // Recreate old triggers on MODULE_CATEGORY_BASE
        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_MCB_ID
            BEFORE INSERT ON ${oldCategoryTableRef}
            FOR EACH ROW
            BEGIN
                IF :NEW.ID IS NULL THEN
                    :NEW.ID := MODULE_CATEGORY_BASE_SEQ.NEXTVAL;
                END IF;
            END;
        `);

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_MCB_TS
            BEFORE INSERT OR UPDATE ON ${oldCategoryTableRef}
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

        // Recreate ROLE_MODULE_CATEGORY table
        await queryInterface.createTable(
            {
                schema: getModelSchema('Role') || undefined,
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
            ALTER TABLE ${moduleCategorySchemaPrefix}ROLE_MODULE_CATEGORY
            ADD CONSTRAINT PK_RMC PRIMARY KEY (ROLE_ID, MODULE_CATEGORY_ID)
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE ${moduleCategorySchemaPrefix}ROLE_MODULE_CATEGORY
            ADD CONSTRAINT FK_RMC_ROLE FOREIGN KEY (ROLE_ID)
            REFERENCES ${roleTableRef}(ID)
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE ${moduleCategorySchemaPrefix}ROLE_MODULE_CATEGORY
            ADD CONSTRAINT FK_RMC_MCB FOREIGN KEY (MODULE_CATEGORY_ID)
            REFERENCES ${oldCategoryTableRef}(ID)
        `);

        await queryInterface.sequelize.query(`
            CREATE OR REPLACE TRIGGER TRG_RMC_TS
            BEFORE INSERT OR UPDATE ON ${moduleCategorySchemaPrefix}ROLE_MODULE_CATEGORY
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

        // Restore original ROLE_MODULE seeds
        await queryInterface.sequelize.query(`
            INSERT INTO ${roleModuleTableRef} (ROLE_ID, MODULE_ID, CREATEDON, UPDATEDON)
            SELECT R.ID, M.ID, SYSTIMESTAMP, SYSTIMESTAMP
            FROM ${roleTableRef} R
            CROSS JOIN ${moduleTableRef} M
            WHERE R.CODE = 'ADMINISTRATOR'
              AND M.CODE IN ('DASHBOARD', 'USER_MANAGEMENT')
              AND NOT EXISTS (
                  SELECT 1
                  FROM ${roleModuleTableRef} RM
                  WHERE RM.ROLE_ID = R.ID
                    AND RM.MODULE_ID = M.ID
              )
        `);

        // Restore ROLE_MODULE_CATEGORY seeds
        await queryInterface.sequelize.query(`
            INSERT INTO ${moduleCategorySchemaPrefix}ROLE_MODULE_CATEGORY (ROLE_ID, MODULE_CATEGORY_ID, CREATEDON, UPDATEDON)
            SELECT R.ID, MCB.ID, SYSTIMESTAMP, SYSTIMESTAMP
            FROM ${roleTableRef} R
            CROSS JOIN ${oldCategoryTableRef} MCB
            WHERE R.CODE = 'ADMINISTRATOR'
              AND MCB.CODE IN ('DASHBOARD', 'USER_MANAGEMENT')
              AND NOT EXISTS (
                  SELECT 1
                  FROM ${moduleCategorySchemaPrefix}ROLE_MODULE_CATEGORY RMC
                  WHERE RMC.ROLE_ID = R.ID
                    AND RMC.MODULE_CATEGORY_ID = MCB.ID
              )
        `);
    },
};
