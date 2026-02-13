'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('training_plan_versions', 'createdFrom', {
      type: Sequelize.JSONB,
      allowNull: true,
    });

    // Helps querying and dataset extraction (e.g. filter by input constraints/goals).
    await queryInterface.addIndex('training_plan_versions', {
      fields: ['createdFrom'],
      using: 'gin',
      name: 'training_plan_versions_created_from_gin',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'training_plan_versions',
      'training_plan_versions_created_from_gin'
    );
    await queryInterface.removeColumn('training_plan_versions', 'createdFrom');
  },
};
