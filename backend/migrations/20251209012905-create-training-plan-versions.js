'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('training_plan_versions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      trainingPlanId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'training_plans',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      versionNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      source: {
        type: Sequelize.STRING, //automatic, manual
        allowNull: false,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      comments: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      items: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('training_plan_versions');
  },
};
