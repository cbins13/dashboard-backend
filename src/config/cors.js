'use strict';

const config = require('./env');

const allowedOrigins = new Set(
    [config.frontendUrl, 'http://localhost:5173']
        .filter(Boolean)
        .map((origin) => origin.replace(/\/$/, ''))
);

const corsOptions = {
    origin: (origin, callback) => {
        const normalizedOrigin = origin ? origin.replace(/\/$/, '') : origin;

        if (!normalizedOrigin || allowedOrigins.has(normalizedOrigin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'x-session-id'],
    exposedHeaders: ['x-csrf-token'],
    optionsSuccessStatus: 200,
};

module.exports = corsOptions;
