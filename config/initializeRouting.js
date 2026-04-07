const personRoutes = require('../routes/personRoutes');

const initializeRouting = (app) => {
	// Legacy — kept for backward compatibility; new Person CRUD lives in src/modules/persons/
	app.use('/api/persons', personRoutes);
};

module.exports = initializeRouting;
