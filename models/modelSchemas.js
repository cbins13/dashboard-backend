const { resolveSchema } = require('../db/schemaContext');

const modelSchemas = {
    Person: 'CHRISTIAN2',
    Users: 'CHRISTIAN2',
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