'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove quantity column from exercise_equipment table
    await queryInterface.removeColumn('exercise_equipment', 'quantity');
  },

  down: async (queryInterface, Sequelize) => {
    // Restore quantity column for rollback
    await queryInterface.addColumn('exercise_equipment', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    });
  },
};
