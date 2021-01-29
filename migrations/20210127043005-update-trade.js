'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.describeTable('Trades')
    .then(tableDefinition => {
        if (tableDefinition.group) {
            return Promise.resolve();
        } else {
            return queryInterface.addColumn('Trades', 'group', {
                type: Sequelize.STRING
             });
        }
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.describeTable('Trades')
    .then(tableDefinition => {
        if (tableDefinition.group) {
            return queryInterface.removeColumn('Trades', 'group');
        } else {
            return Promise.resolve();
        }
    })
  }
};
