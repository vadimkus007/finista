'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return Promise.all([
        
        queryInterface.describeTable('Trades')
        .then(tableDefinition => {

            if (tableDefinition.value) return Promise.resolve();

            return queryInterface.addColumn('Trades', 'value', {
                type: Sequelize.DECIMAL(10,2),
                allowNull: false,
                defaultValue: 100.00
             });
        }),

        queryInterface.describeTable('Trades')
        .then(tableDefinition => {

            if (tableDefinition.accint) return Promise.resolve();

            return queryInterface.addColumn('Trades', 'accint', {
                type: Sequelize.DECIMAL(10,2),
                allowNull: false,
                defaultValue: 0.00
             });
        })

    ]);

  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     return Promise.all([

        queryInterface.describeTable('Trades')
        .then(tableDefinition => {
            if (tableDefinition.value) {
                return queryInterface.removeColumn('Trades', 'value');
            } else {
                return Promise.resolve();
            }
        }),

        queryInterface.describeTable('Trades')
        .then(tableDefinition => {
            if (tableDefinition.accint) {
                return queryInterface.removeColumn('Trades', 'accint');
            } else {
                return Promise.resolve();
            }
        })
    ]);
  }
};
