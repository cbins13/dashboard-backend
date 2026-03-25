'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('morgan');
const corsOptions = require('./config/cors');
const helmetOptions = require('./config/security');
const apiRouter = require('./routes/index');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const createApp = () => {
    const app = express();

    app.enable('trust proxy');

    // ─── Global middleware ────────────────────────────────────────────────────────
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(logger('combined'));
    app.use(helmet(helmetOptions));

    // ─── API routes ──────────────────────────────────────────────────────────────
    app.use('/api/v1', apiRouter);

    // ─── Error handling ──────────────────────────────────────────────────────────
    app.use(notFound);
    app.use(errorHandler);

    return app;
};

module.exports = createApp;
