require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT_DEV;
const initializeServer = require('./config/initializeServer');

initializeServer(express, app);


app.get('/', (req, res) => {
    res.status(200).json({ message: 'Hello, World!' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});