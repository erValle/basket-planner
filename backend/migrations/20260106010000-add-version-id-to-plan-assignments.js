'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add trainingPlanVersionId to plan_assignments to track which version is assigned
    await queryInterface.addColumn('plan_assignments', 'trainingPlanVersionId', {
      type: Sequelize.INTEGER,
      allowNull: true, // nullable para mantener compatibilidad con asignaciones existentes
      references: {
        model: 'training_plan_versions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for faster lookups
    await queryInterface.addIndex('plan_assignments', ['trainingPlanVersionId'], {
      name: 'plan_assignments_trainingPlanVersionId_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('plan_assignments', 'plan_assignments_trainingPlanVersionId_idx');
    await queryInterface.removeColumn('plan_assignments', 'trainingPlanVersionId');
  }
};
