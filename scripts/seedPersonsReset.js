require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const { initDatabase, getModels, getSequelize } = require('../db/connectionPool');
const { resolveConfiguredSchema, resolveSchema, withTargetSchema } = require('../db/schemaContext');
const { getModelSchema } = require('../models/modelSchemas');

const sampleDataPath = path.join(__dirname, '..', 'sample-data', 'persons.json');

const validatePersonRecord = (record, index) => {
    if (typeof record !== 'object' || record === null || Array.isArray(record)) {
        throw new Error(`Sample person at index ${index} must be an object.`);
    }

    if (typeof record.name !== 'string' || record.name.trim().length === 0) {
        throw new Error(`Sample person at index ${index} must include a non-empty name.`);
    }

    if (record.age !== undefined && record.age !== null && !Number.isInteger(record.age)) {
        throw new Error(`Sample person at index ${index} has an invalid age.`);
    }

    if (
        record.height !== undefined &&
        record.height !== null &&
        (typeof record.height !== 'number' || !Number.isFinite(record.height))
    ) {
        throw new Error(`Sample person at index ${index} has an invalid height.`);
    }

    return {
        name: record.name.trim(),
        age: record.age ?? null,
        height: record.height ?? null,
    };
};

const loadSamplePersons = async () => {
    const rawContent = await fs.readFile(sampleDataPath, 'utf8');
    const records = JSON.parse(rawContent);

    if (!Array.isArray(records) || records.length === 0) {
        throw new Error('sample-data/persons.json must contain a non-empty array of person records.');
    }

    return records.map((record, index) => validatePersonRecord(record, index));
};

const resolvePersonSeedSchema = () => {
    const configuredPersonSchema = getModelSchema('Person');
    const explicitSchema = process.env.ORACLE_TARGET_SCHEMA;

    if (!configuredPersonSchema) {
        return resolveConfiguredSchema();
    }

    if (!explicitSchema) {
        return configuredPersonSchema;
    }

    const requestedSchema = resolveSchema(explicitSchema, 'ORACLE_TARGET_SCHEMA');

    if (requestedSchema !== configuredPersonSchema) {
        throw new Error(
            `Person is pinned to schema ${configuredPersonSchema} and cannot target ${requestedSchema}.`
        );
    }

    return configuredPersonSchema;
};

const run = async () => {
    const sequelize = getSequelize();

    try {
        await initDatabase();
        const { Person } = getModels();
        const persons = await loadSamplePersons();
        const targetSchema = resolvePersonSeedSchema();
        const insertedRecords = await withTargetSchema(sequelize, targetSchema, async (transaction) => {
            await Person.destroy({ where: {}, transaction });
            return Person.bulkCreate(persons, { transaction });
        });

        console.log(
            `Cleared PERSON table and inserted ${insertedRecords.length} sample records in schema ${targetSchema}.`
        );
    } catch (error) {
        console.error('Reset seed failed:', error.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
};

run();