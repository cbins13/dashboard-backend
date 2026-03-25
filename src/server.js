'use strict';

// Must be the first require: loads .env and validates all required env vars at startup.
const config = require('./config/env');

const createApp = require('./app');
const { initDatabase, getSequelize, getModels } = require('./infrastructure/db/oracle');

const startServer = async () => {
    try {
        await initDatabase();

        const app = createApp();

        app.locals.db = {
            sequelize: getSequelize(),
            models: getModels(),
        };

        app.listen(config.port, () => {
            console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
