'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('plan_assignments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      trainingPlanId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'training_plans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assignedById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assignedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'assigned'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('plan_assignments', ['trainingPlanId'], {
      name: 'plan_assignments_trainingPlanId_idx',
    });
    await queryInterface.addIndex('plan_assignments', ['userId'], {
      name: 'plan_assignments_userId_idx',
    });
    await queryInterface.addIndex('plan_assignments', ['trainingPlanId', 'userId'], {
      name: 'plan_assignments_training_plan_user_unique',
      unique: true,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('plan_assignments', 'plan_assignments_trainingPlanId_idx');
    await queryInterface.removeIndex('plan_assignments', 'plan_assignments_userId_idx');
    await queryInterface.removeIndex('plan_assignments', 'plan_assignments_training_plan_user_unique');
    await queryInterface.dropTable('plan_assignments');
  }
};