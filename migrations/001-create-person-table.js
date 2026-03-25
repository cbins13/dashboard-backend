const { getModelSchema } = require('../models/modelSchemas');

const getPersonTableReference = () => {
    return {
        schema: getModelSchema('Person') || undefined,
        tableName: 'PERSON',
    };
};

module.exports = {
    name: '001-create-person-table',
    up: async ({ queryInterface, Sequelize }) => {
        await queryInterface.createTable(getPersonTableReference(), {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            age: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            height: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: true,
            },
        });
    },
    down: async ({ queryInterface }) => {
        await queryInterface.dropTable(getPersonTableReference());
    },
};