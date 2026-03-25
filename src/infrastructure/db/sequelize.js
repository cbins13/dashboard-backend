'use strict';

const { Sequelize } = require('sequelize');
const oracledb = require('oracledb');
const config = require('../../config/env');

let oracleClientInitialized = false;

const initializeOracleClient = () => {
    if (config.oracle.clientMode !== 'thick' || oracleClientInitialized) {
        return;
    }

    if (!config.oracle.clientLibDir) {
        throw new Error(
            'ORACLE_CLIENT_LIB_DIR is required when ORACLE_CLIENT_MODE is set to thick.'
        );
    }

    oracledb.initOracleClient({ libDir: config.oracle.clientLibDir });
    oracleClientInitialized = true;
};

const createSequelizeInstance = () => {
    initializeOracleClient();

    return new Sequelize({
        dialect: 'oracle',
        username: config.oracle.user,
        password: config.oracle.password,
        dialectOptions: {
            connectString: config.oracle.connectString,
        },
        logging: config.sequelizeLogging ? console.log : false,
        pool: {
            max: config.oracle.poolMax,
            min: config.oracle.poolMin,
            acquire: config.oracle.poolAcquire,
            idle: config.oracle.poolIdle,
        },
    });
};

module.exports = { createSequelizeInstance };
