'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     return queryInterface.addColumn('Trades', 'value', {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false,
        defaultValue: 100.00
     })
     .then(_ => queryInterface.addColumn('Trades', 'accint', {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false,
        defaultValue: 0.00
     }));
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     return queryInterface.removeColumn('Trades', 'accint')
     .then(_ => queryInterface.removeColumn('Trades', 'value'));
  }
};
