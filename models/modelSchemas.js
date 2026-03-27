const { resolveSchema } = require('../db/schemaContext');

const modelSchemas = {
    Person: 'CHRISTIAN2',
    User: 'CHRISTIAN2',
    Users: 'CHRISTIAN2',
    Role: 'CHRISTIAN2',
    Module: 'CHRISTIAN2',
    ModuleCategory: 'CHRISTIAN2',
    UserRole: 'CHRISTIAN2',
    RoleModule: 'CHRISTIAN2',
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