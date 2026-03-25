const ORACLE_SCHEMA_PATTERN = /^[A-Za-z][A-Za-z0-9_$#]{0,29}$/;

const normalizeSchemaName = (schemaName) => {
    if (typeof schemaName !== 'string') {
        return '';
    }

    return schemaName.trim().toUpperCase();
};

const assertValidSchemaName = (schemaName, sourceLabel) => {
    const normalizedSchemaName = normalizeSchemaName(schemaName);

    if (!normalizedSchemaName) {
        throw new Error(`${sourceLabel} is required.`);
    }

    if (!ORACLE_SCHEMA_PATTERN.test(normalizedSchemaName)) {
        throw new Error(
            `${sourceLabel} must be a valid Oracle schema name using unquoted identifier rules.`
        );
    }

    return normalizedSchemaName;
};

const getAllowedSchemas = () => {
    const configuredSchemas = process.env.ORACLE_ALLOWED_SCHEMAS;

    if (!configuredSchemas) {
        return null;
    }

    const allowedSchemas = configuredSchemas
        .split(',')
        .map((schemaName) => schemaName.trim())
        .filter(Boolean)
        .map((schemaName) => assertValidSchemaName(schemaName, 'ORACLE_ALLOWED_SCHEMAS entry'));

    return new Set(allowedSchemas);
};

const ensureSchemaIsAllowed = (schemaName) => {
    const allowedSchemas = getAllowedSchemas();

    if (!allowedSchemas || allowedSchemas.has(schemaName)) {
        return schemaName;
    }

    throw new Error(`Schema ${schemaName} is not allowed for this application.`);
};

const getLoginSchema = () =>
    assertValidSchemaName(process.env.ORACLE_DB_USER, 'ORACLE_DB_USER');

const getDefaultSchema = () => {
    const configuredDefaultSchema = process.env.ORACLE_DEFAULT_SCHEMA;

    if (configuredDefaultSchema) {
        return assertValidSchemaName(configuredDefaultSchema, 'ORACLE_DEFAULT_SCHEMA');
    }

    return getLoginSchema();
};

const resolveSchema = (schemaName, sourceLabel) =>
    ensureSchemaIsAllowed(assertValidSchemaName(schemaName, sourceLabel));

const resolveRequestSchema = (req) => {
    const requestedSchema = req.get('x-db-schema') || req.query.schema || getDefaultSchema();

    return resolveSchema(requestedSchema, 'Requested schema');
};

const resolveConfiguredSchema = () => {
    const configuredSchema = process.env.ORACLE_TARGET_SCHEMA || getDefaultSchema();

    return resolveSchema(configuredSchema, 'Configured schema');
};

const setCurrentSchema = async (sequelize, transaction, schemaName) => {
    await sequelize.query(`ALTER SESSION SET CURRENT_SCHEMA = ${schemaName}`, {
        transaction,
    });
};

const tryResetSchema = async (sequelize, transaction, schemaName) => {
    if (!transaction || transaction.finished) {
        return;
    }

    try {
        await setCurrentSchema(sequelize, transaction, schemaName);
    } catch (error) {
        console.warn(`Failed to reset Oracle session schema to ${schemaName}: ${error.message}`);
    }
};

const withTargetSchema = async (sequelize, schemaName, work) => {
    const loginSchema = getLoginSchema();
    const targetSchema = resolveSchema(schemaName, 'Target schema');
    const transaction = await sequelize.transaction();

    try {
        await setCurrentSchema(sequelize, transaction, targetSchema);
        const result = await work(transaction, targetSchema);

        if (loginSchema !== targetSchema) {
            await setCurrentSchema(sequelize, transaction, loginSchema);
        }

        await transaction.commit();
        return result;
    } catch (error) {
        await tryResetSchema(sequelize, transaction, loginSchema);

        if (!transaction.finished) {
            await transaction.rollback();
        }

        throw error;
    }
};

module.exports = {
    getDefaultSchema,
    getLoginSchema,
    resolveSchema,
    resolveConfiguredSchema,
    resolveRequestSchema,
    withTargetSchema,
};