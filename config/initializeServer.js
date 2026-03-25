const logger = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const corsOptions = require("./corsOptions");

const initializeServer = (express, app) => {
    app.enable('trust proxy');
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(logger("combined"));
    app.use(helmet());
    app.use(
        helmet.contentSecurityPolicy({
            directives: {
                "script-src": ["'self'", "code.jquery.com", "cdn.jsdelivr.net"],
            },
        })
    );
}

module.exports = initializeServer;