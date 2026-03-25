require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const { DataTypes, Sequelize } = require('sequelize');
const { getSequelize } = require('../db/connectionPool');

const migrationsDirectory = path.join(__dirname, '..', 'migrations');
const metadataTableName = process.env.MIGRATIONS_TABLE_NAME || 'SEQUELIZE_META';

const MigrationMeta = (sequelize) =>
    sequelize.define(
        'MigrationMeta',
        {
            name: {
                type: DataTypes.STRING(255),
                primaryKey: true,
                allowNull: false,
            },
        },
        {
            tableName: metadataTableName,
            freezeTableName: true,
            timestamps: false,
        }
    );

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

const ensureMetadataTable = async (migrationMeta) => {
    await migrationMeta.sync();
};

const getAppliedMigrationNames = async (migrationMeta) => {
    const records = await migrationMeta.findAll({
        attributes: ['name'],
        order: [['name', 'ASC']],
        raw: true,
    });

    return new Set(records.map((record) => record.name));
};

const applyMigrations = async (sequelize, migrationMeta) => {
    const queryInterface = sequelize.getQueryInterface();
    const migrations = await loadMigrations();
    const appliedMigrationNames = await getAppliedMigrationNames(migrationMeta);

    for (const migration of migrations) {
        if (appliedMigrationNames.has(migration.name)) {
            continue;
        }

        console.log(`Applying migration: ${migration.name}`);
        await migration.up({ queryInterface, Sequelize });
        await migrationMeta.create({ name: migration.name });
    }

    console.log('Migrations complete.');
};

const undoMigration = async (sequelize, migrationMeta) => {
    const queryInterface = sequelize.getQueryInterface();
    const migrations = await loadMigrations();
    const appliedMigrationNames = await getAppliedMigrationNames(migrationMeta);
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
    await migrationMeta.destroy({ where: { name: latestMigration.name } });
    console.log('Migration rollback complete.');
};

const undoAllMigrations = async (sequelize, migrationMeta) => {
    const queryInterface = sequelize.getQueryInterface();
    const migrations = await loadMigrations();
    const appliedMigrationNames = await getAppliedMigrationNames(migrationMeta);
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
        await migrationMeta.destroy({ where: { name: migration.name } });
    }

    console.log('All applied migrations were reverted.');
};

const run = async () => {
    const sequelize = getSequelize();
    const migrationMeta = MigrationMeta(sequelize);
    const command = process.argv[2] || 'up';

    try {
        await sequelize.authenticate();
        await ensureMetadataTable(migrationMeta);

        if (command === 'undo') {
            await undoMigration(sequelize, migrationMeta);
        } else if (command === 'undo:all') {
            await undoAllMigrations(sequelize, migrationMeta);
        } else {
            await applyMigrations(sequelize, migrationMeta);
        }
    } catch (error) {
        console.error('Migration command failed:', error.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
};

run();