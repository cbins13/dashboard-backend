const { Sequelize } = require('sequelize');
const initializeModels = require('../models');
const { initializeOracleClient } = require('./oracleClient');

let sequelize;
let models;

const parsePoolValue = (value, fallback) => {
	const parsedValue = Number.parseInt(value, 10);

	return Number.isNaN(parsedValue) ? fallback : parsedValue;
};

const validateDatabaseConfig = () => {
	const requiredVariables = [
		'ORACLE_DB_USER',
		'ORACLE_DB_PASSWORD',
		'ORACLE_DB_CONNECT_STRING',
	];

	const missingVariables = requiredVariables.filter(
		(variableName) => !process.env[variableName]
	);

	if (missingVariables.length > 0) {
		throw new Error(
			`Missing Oracle database environment variables: ${missingVariables.join(', ')}`
		);
	}
};

const createSequelizeInstance = () => {
	initializeOracleClient();

	return new Sequelize({
		dialect: 'oracle',
		username: process.env.ORACLE_DB_USER,
		password: process.env.ORACLE_DB_PASSWORD,
		dialectOptions: {
			connectString: process.env.ORACLE_DB_CONNECT_STRING,
		},
		quoteIdentifiers: false,
		logging: process.env.SEQUELIZE_LOGGING === 'true' ? console.log : false,
		pool: {
			max: parsePoolValue(process.env.ORACLE_POOL_MAX, 5),
			min: parsePoolValue(process.env.ORACLE_POOL_MIN, 0),
			acquire: parsePoolValue(process.env.ORACLE_POOL_ACQUIRE, 30000),
			idle: parsePoolValue(process.env.ORACLE_POOL_IDLE, 10000),
		},
	});
};

const getSequelize = () => {
	if (!sequelize) {
		validateDatabaseConfig();
		sequelize = createSequelizeInstance();
		models = initializeModels(sequelize);
	}

	return sequelize;
};

const getModels = () => {
	if (!models) {
		getSequelize();
	}

	return models;
};

const initDatabase = async () => {
	const sequelizeInstance = getSequelize();

	await sequelizeInstance.authenticate();
	console.log('Oracle database connection established successfully.');

	return sequelizeInstance;
};

module.exports = {
	getModels,
	getSequelize,
	initDatabase,
};
