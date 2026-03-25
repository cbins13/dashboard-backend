'use strict';

const initializeModels = require('../../models');
const { createSequelizeInstance } = require('./sequelize');

// ─── State ─────────────────────────────────────────────────────────────────────

let sequelize;
let models;

// ─── Schema utilities ─────────────────────────────────────────────────────────

const ORACLE_SCHEMA_PATTERN = /^[A-Za-z][A-Za-z0-9_$#]{0,29}$/;

const normalizeSchemaName = (schemaName) => {
    if (typeof schemaName !== 'string') return '';
    return schemaName.trim().toUpperCase();
};

const assertValidSchemaName = (schemaName, sourceLabel) => {
    const normalized = normalizeSchemaName(schemaName);

    if (!normalized) {
        throw new Error(`${sourceLabel} is required.`);
    }

    if (!ORACLE_SCHEMA_PATTERN.test(normalized)) {
        throw new Error(
            `${sourceLabel} must be a valid Oracle schema name using unquoted identifier rules.`
        );
    }

    return normalized;
};

const getAllowedSchemas = () => {
    const configured = process.env.ORACLE_ALLOWED_SCHEMAS;

    if (!configured) return null;

    return new Set(
        configured
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s) => assertValidSchemaName(s, 'ORACLE_ALLOWED_SCHEMAS entry'))
    );
};

const ensureSchemaIsAllowed = (schemaName) => {
    const allowed = getAllowedSchemas();

    if (!allowed || allowed.has(schemaName)) return schemaName;

    throw new Error(`Schema ${schemaName} is not allowed for this application.`);
};

const getLoginSchema = () =>
    assertValidSchemaName(process.env.ORACLE_DB_USER, 'ORACLE_DB_USER');

const getDefaultSchema = () => {
    const configured = process.env.ORACLE_DEFAULT_SCHEMA;

    if (configured) {
        return assertValidSchemaName(configured, 'ORACLE_DEFAULT_SCHEMA');
    }

    return getLoginSchema();
};

const resolveSchema = (schemaName, sourceLabel) =>
    ensureSchemaIsAllowed(assertValidSchemaName(schemaName, sourceLabel));

const resolveRequestSchema = (req) => {
    const requested = req.get('x-db-schema') || req.query.schema || getDefaultSchema();
    return resolveSchema(requested, 'Requested schema');
};

const resolveConfiguredSchema = () => {
    const configured = process.env.ORACLE_TARGET_SCHEMA || getDefaultSchema();
    return resolveSchema(configured, 'Configured schema');
};

const setCurrentSchema = async (seq, transaction, schemaName) => {
    await seq.query(`ALTER SESSION SET CURRENT_SCHEMA = ${schemaName}`, { transaction });
};

const tryResetSchema = async (seq, transaction, schemaName) => {
    if (!transaction || transaction.finished) return;

    try {
        await setCurrentSchema(seq, transaction, schemaName);
    } catch (err) {
        console.warn(
            `Failed to reset Oracle session schema to ${schemaName}: ${err.message}`
        );
    }
};

const withTargetSchema = async (seq, schemaName, work) => {
    const loginSchema = getLoginSchema();
    const targetSchema = resolveSchema(schemaName, 'Target schema');
    const transaction = await seq.transaction();

    try {
        await setCurrentSchema(seq, transaction, targetSchema);
        const result = await work(transaction, targetSchema);

        if (loginSchema !== targetSchema) {
            await setCurrentSchema(seq, transaction, loginSchema);
        }

        await transaction.commit();
        return result;
    } catch (error) {
        await tryResetSchema(seq, transaction, loginSchema);

        if (!transaction.finished) {
            await transaction.rollback();
        }

        throw error;
    }
};

// ─── Connection API ────────────────────────────────────────────────────────────

const getSequelize = () => {
    if (!sequelize) {
        sequelize = createSequelizeInstance();
        models = initializeModels(sequelize);
    }

    return sequelize;
};

const getModels = () => {
    if (!models) getSequelize();
    return models;
};

const initDatabase = async () => {
    const seq = getSequelize();
    await seq.authenticate();
    console.log('Oracle database connection established successfully.');
    return seq;
};

module.exports = {
    getSequelize,
    getModels,
    initDatabase,
    getDefaultSchema,
    getLoginSchema,
    resolveSchema,
    resolveRequestSchema,
    resolveConfiguredSchema,
    withTargetSchema,
};
