const oracledb = require('oracledb');

let oracleClientInitialized = false;

const isThickModeEnabled = () =>
    String(process.env.ORACLE_CLIENT_MODE || 'thin').toLowerCase() === 'thick';

const initializeOracleClient = () => {
    if (!isThickModeEnabled() || oracleClientInitialized) {
        return;
    }

    const libDir = process.env.ORACLE_CLIENT_LIB_DIR;

    if (!libDir) {
        throw new Error(
            'ORACLE_CLIENT_LIB_DIR is required when ORACLE_CLIENT_MODE is set to thick.'
        );
    }

    oracledb.initOracleClient({ libDir });
    oracleClientInitialized = true;
};

module.exports = {
    initializeOracleClient,
    isThickModeEnabled,
};