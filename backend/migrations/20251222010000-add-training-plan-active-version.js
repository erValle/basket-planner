'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('training_plans', 'activeVersionId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'training_plan_versions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('training_plans', ['activeVersionId']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('training_plans', ['activeVersionId']);
    await queryInterface.removeColumn('training_plans', 'activeVersionId');
  }
};
