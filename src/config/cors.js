'use strict';

const config = require('./env');

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || origin === config.frontendUrl) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200,
};

module.exports = corsOptions;
