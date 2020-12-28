'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Trades', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      portfolioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Portfolios',
          key: 'id'
        }
      },
      operationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Operations',
          key: 'id'
        }
      },
      secid: {
        type: Sequelize.STRING,
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false,
        defaultValue: 0.00
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      comission: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 0.00
      },
      comment: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Trades');
  }
};