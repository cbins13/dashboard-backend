// Reset seed script for USERS table — clears all existing rows and reseeds.
// All seed records use the bcrypt hash of 'password123' (cost 12) as the stored password.
// To log in with a seed user: POST /api/v1/auth/login { "username": "<username>", "password": "password123" }

require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const { initDatabase, getModels, getSequelize } = require('../db/connectionPool');
const { resolveConfiguredSchema, resolveSchema, withTargetSchema } = require('../db/schemaContext');
const { getModelSchema } = require('../models/modelSchemas');

const sampleDataPath = path.join(__dirname, '..', 'sample-data', 'users.json');

const validateUserRecord = (record, index) => {
    if (typeof record !== 'object' || record === null || Array.isArray(record)) {
        throw new Error(`Sample user at index ${index} must be an object.`);
    }

    if (typeof record.username !== 'string' || record.username.trim().length === 0) {
        throw new Error(`Sample user at index ${index} must include a non-empty username.`);
    }

    if (typeof record.password !== 'string' || record.password.trim().length === 0) {
        throw new Error(`Sample user at index ${index} must include a non-empty password.`);
    }

    if (typeof record.displayname !== 'string' || record.displayname.trim().length === 0) {
        throw new Error(`Sample user at index ${index} must include a non-empty displayname.`);
    }

    return {
        username: record.username.trim(),
        password: record.password,
        displayname: record.displayname.trim(),
        userstatus: record.userstatus ?? 'ACTIVE',
        archived: record.archived ?? 0,
    };
};

const loadSampleUsers = async () => {
    const rawContent = await fs.readFile(sampleDataPath, 'utf8');
    const records = JSON.parse(rawContent);

    if (!Array.isArray(records) || records.length === 0) {
        throw new Error('sample-data/users.json must contain a non-empty array of user records.');
    }

    return records.map((record, index) => validateUserRecord(record, index));
};

const resolveUserSeedSchema = () => {
    const configuredUserSchema = getModelSchema('Users');
    const explicitSchema = process.env.ORACLE_TARGET_SCHEMA;

    if (!configuredUserSchema) {
        return resolveConfiguredSchema();
    }

    if (!explicitSchema) {
        return configuredUserSchema;
    }

    const requestedSchema = resolveSchema(explicitSchema, 'ORACLE_TARGET_SCHEMA');

    if (requestedSchema !== configuredUserSchema) {
        throw new Error(
            `Users is pinned to schema ${configuredUserSchema} and cannot target ${requestedSchema}.`
        );
    }

    return configuredUserSchema;
};

const run = async () => {
    const sequelize = getSequelize();

    try {
        await initDatabase();
        const { User } = getModels();
        const users = await loadSampleUsers();
        const targetSchema = resolveUserSeedSchema();
        const insertedRecords = await withTargetSchema(sequelize, targetSchema, async (transaction) => {
            await User.destroy({ where: {}, transaction });
            return User.bulkCreate(users, { transaction });
        });

        console.log(
            `Cleared USERS table and inserted ${insertedRecords.length} sample records in schema ${targetSchema}.`
        );
    } catch (error) {
        console.error('Reset seed failed:', error.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
};

run();
