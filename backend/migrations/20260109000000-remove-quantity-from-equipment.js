'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove quantity column from equipment table
    await queryInterface.removeColumn('equipment', 'quantity');
  },

  down: async (queryInterface, Sequelize) => {
    // Restore quantity column for rollback
    await queryInterface.addColumn('equipment', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },
};
