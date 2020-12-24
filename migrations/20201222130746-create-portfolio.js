'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Portfolios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
                notEmpty: true
            } 
      },
      currency: {
        type: Sequelize.ENUM('RUB', 'USD', 'EUR', 'GBP'),
        allowNull: false,
        defaultValue: 'RUB'
      },
      comission: {
        type: Sequelize.DECIMAL(8,5),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
          isDecimal: true
        }
      },
      memo: {
        type: Sequelize.TEXT
      },
      dateopen: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: '2020-01-01',
        valudate: {
          isDate: true
        }
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
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
    await queryInterface.dropTable('Portfolios');
  }
};