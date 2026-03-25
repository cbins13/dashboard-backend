require('dotenv').config();
const express = require('express');
const app = express();
const port = Number(process.env.PORT_DEV) || 3000;
const initializeServer = require('./config/initializeServer');
const initializeRouting = require('./config/initializeRouting');
const { initDatabase, getModels, getSequelize } = require('./db/connectionPool');

initializeServer(express, app);
initializeRouting(app);


app.get('/', (req, res) => {
    res.status(200).json({ message: 'Hello, World!' });
});

const startServer = async () => {
    try {
        await initDatabase();

        app.locals.db = {
            sequelize: getSequelize(),
            models: getModels(),
        };

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();