'use strict';

require('dotenv').config();

const required = (name) => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
};

const parseIntEnv = (name, fallback) => {
    const parsed = Number.parseInt(process.env[name], 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const config = Object.freeze({
    port: parseIntEnv('PORT', parseIntEnv('PORT_DEV', 3000)),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL,
    jwtAccessSecret: required('ACCESS_TOKEN_SECRET'),
    jwtAccessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
    oracle: Object.freeze({
        user: required('ORACLE_DB_USER'),
        password: required('ORACLE_DB_PASSWORD'),
        connectString: required('ORACLE_DB_CONNECT_STRING'),
        poolMax: parseIntEnv('ORACLE_POOL_MAX', 5),
        poolMin: parseIntEnv('ORACLE_POOL_MIN', 0),
        poolAcquire: parseIntEnv('ORACLE_POOL_ACQUIRE', 30000),
        poolIdle: parseIntEnv('ORACLE_POOL_IDLE', 10000),
        clientMode: (process.env.ORACLE_CLIENT_MODE || 'thin').toLowerCase(),
        clientLibDir: process.env.ORACLE_CLIENT_LIB_DIR,
        defaultSchema: process.env.ORACLE_DEFAULT_SCHEMA,
        allowedSchemas: process.env.ORACLE_ALLOWED_SCHEMAS,
        targetSchema: process.env.ORACLE_TARGET_SCHEMA,
    }),
    sequelizeLogging: process.env.SEQUELIZE_LOGGING === 'true',
});

module.exports = config;
