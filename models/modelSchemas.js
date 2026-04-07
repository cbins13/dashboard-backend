const { resolveSchema } = require('../db/schemaContext');

const modelSchemas = {
    Person: process.env.ORACLE_DEFAULT_SCHEMA,
    User: process.env.ORACLE_DEFAULT_SCHEMA,
    Users: process.env.ORACLE_DEFAULT_SCHEMA,
    Role: process.env.ORACLE_DEFAULT_SCHEMA,
    Module: process.env.ORACLE_DEFAULT_SCHEMA,
    ModuleCategory: process.env.ORACLE_DEFAULT_SCHEMA,
    UserRole: process.env.ORACLE_DEFAULT_SCHEMA,
    RoleModule: process.env.ORACLE_DEFAULT_SCHEMA,
};

const getModelSchema = (modelName) => {
    const configuredSchema = modelSchemas[modelName];

    if (!configuredSchema) {
        return null;
    }

    return resolveSchema(configuredSchema, `${modelName} schema`);
};

module.exports = {
    getModelSchema,
    modelSchemas,
};