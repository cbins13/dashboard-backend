require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const { Sequelize } = require('sequelize');
const { getSequelize } = require('../db/connectionPool');

const migrationsDirectory = path.join(__dirname, '..', 'migrations');
const metadataTableName = process.env.MIGRATIONS_TABLE_NAME || 'SEQUELIZE_META';

// ---------------------------------------------------------------------------
// Raw-SQL metadata helpers — completely bypasses Sequelize identifier quoting
// so no ORA-00904 can occur regardless of how the table was originally created.
// ---------------------------------------------------------------------------

const ensureMetadataTable = async (sequelize) => {
    await sequelize.query(
        `BEGIN
           EXECUTE IMMEDIATE
             'CREATE TABLE ${metadataTableName} (NAME VARCHAR2(255) NOT NULL, CONSTRAINT PK_${metadataTableName} PRIMARY KEY (NAME))';
         EXCEPTION
           WHEN OTHERS THEN
             IF SQLCODE = -955 THEN
               -- Table already exists; rename the column if it was created with lowercase quoting
               BEGIN
                 EXECUTE IMMEDIATE 'ALTER TABLE ${metadataTableName} RENAME COLUMN "name" TO NAME';
               EXCEPTION
                 WHEN OTHERS THEN NULL;
               END;
             END IF;
         END;`
    );
};

const getAppliedMigrationNames = async (sequelize) => {
    const [records] = await sequelize.query(
        `SELECT NAME FROM ${metadataTableName} ORDER BY NAME ASC`
    );
    return new Set(records.map((row) => row.NAME));
};

const recordMigration = async (sequelize, name) => {
    await sequelize.query(
        `INSERT INTO ${metadataTableName} (NAME) VALUES (:name)`,
        { replacements: { name } }
    );
};

const deleteMigrationRecord = async (sequelize, name) => {
    await sequelize.query(
        `DELETE FROM ${metadataTableName} WHERE NAME = :name`,
        { replacements: { name } }
    );
};

const loadMigrations = async () => {
    const entries = await fs.readdir(migrationsDirectory);

    return entries
        .filter((entry) => entry.endsWith('.js'))
        .sort((left, right) => left.localeCompare(right))
        .map((entry) => {
            const migration = require(path.join(migrationsDirectory, entry));

            return {
                fileName: entry,
                name: migration.name || entry,
                up: migration.up,
                down: migration.down,
            };
        });
};

const applyMigrations = async (sequelize) => {
    const queryInterface = sequelize.getQueryInterface();
    const migrations = await loadMigrations();
    const appliedMigrationNames = await getAppliedMigrationNames(sequelize);

    for (const migration of migrations) {
        if (appliedMigrationNames.has(migration.name)) {
            continue;
        }

        console.log(`Applying migration: ${migration.name}`);
        await migration.up({ queryInterface, Sequelize });
        await recordMigration(sequelize, migration.name);
    }

    console.log('Migrations complete.');
};

const undoMigration = async (sequelize) => {
    const queryInterface = sequelize.getQueryInterface();
    const migrations = await loadMigrations();
    const appliedMigrationNames = await getAppliedMigrationNames(sequelize);
    const appliedMigrations = migrations.filter((migration) =>
        appliedMigrationNames.has(migration.name)
    );
    const latestMigration = appliedMigrations.at(-1);

    if (!latestMigration) {
        console.log('No applied migrations to undo.');
        return;
    }

    console.log(`Reverting migration: ${latestMigration.name}`);
    await latestMigration.down({ queryInterface, Sequelize });
    await deleteMigrationRecord(sequelize, latestMigration.name);
    console.log('Migration rollback complete.');
};

const undoAllMigrations = async (sequelize) => {
    const queryInterface = sequelize.getQueryInterface();
    const migrations = await loadMigrations();
    const appliedMigrationNames = await getAppliedMigrationNames(sequelize);
    const appliedMigrations = migrations.filter((migration) =>
        appliedMigrationNames.has(migration.name)
    );

    if (appliedMigrations.length === 0) {
        console.log('No applied migrations to clear.');
        return;
    }

    const migrationsToRevert = [...appliedMigrations].reverse();

    for (const migration of migrationsToRevert) {
        console.log(`Reverting migration: ${migration.name}`);
        await migration.down({ queryInterface, Sequelize });
        await deleteMigrationRecord(sequelize, migration.name);
    }

    console.log('All applied migrations were reverted.');
};

const run = async () => {
    const sequelize = getSequelize();
    const command = process.argv[2] || 'up';

    try {
        await sequelize.authenticate();
        await ensureMetadataTable(sequelize);

        if (command === 'undo') {
            await undoMigration(sequelize);
        } else if (command === 'undo:all') {
            await undoAllMigrations(sequelize);
        } else {
            await applyMigrations(sequelize);
        }
    } catch (error) {
        console.error('Migration command failed:', error.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
};

run();