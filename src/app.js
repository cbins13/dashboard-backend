'use strict';

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const logger = require('morgan');
const corsOptions = require('./config/cors');
const { helmetOptions, securityPolicy } = require('./config/security');
const apiRouter = require('./routes/index');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { validateApiIngress } = require('./middleware/validateRequest');
const { ipRateLimiter } = require('./middleware/rateLimiter');

const createApp = () => {
    const app = express();

    app.enable('trust proxy');

    // ─── Global middleware ────────────────────────────────────────────────────────
    app.use(logger('combined'));
    app.use(validateApiIngress);
    app.use(ipRateLimiter);
    app.use(cors(corsOptions));
    app.use(helmet(helmetOptions));
    app.use(express.json({ limit: securityPolicy.payloadLimits.defaultBytes }));
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // ─── API routes ──────────────────────────────────────────────────────────────
    app.use('/api/v1', apiRouter);

    // ─── Error handling ──────────────────────────────────────────────────────────
    app.use(notFound);
    app.use(errorHandler);

    return app;
};

module.exports = createApp;
