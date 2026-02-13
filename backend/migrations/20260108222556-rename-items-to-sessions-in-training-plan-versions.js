'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Renombrar la columna items a sessions para mayor claridad
    await queryInterface.renameColumn('training_plan_versions', 'items', 'sessions');
  },

  async down(queryInterface, Sequelize) {
    // Revertir el cambio
    await queryInterface.renameColumn('training_plan_versions', 'sessions', 'items');
  },
};
