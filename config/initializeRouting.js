const personRoutes = require('../routes/personRoutes');

const initializeRouting = (app) => {
	app.use('/api/persons', personRoutes);
};

module.exports = initializeRouting;
