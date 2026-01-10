'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add sessionId column to track session-level feedback
    await queryInterface.addColumn('feedbacks', 'sessionId', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Session identifier from training plan version items.sessions[].sessionId'
    });

    // Add targetType to distinguish between version-level and session-level feedback
    await queryInterface.addColumn('feedbacks', 'targetType', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'version',
      comment: 'Type of feedback: "version" (planning-level) or "session" (session-level)'
    });

    // Add index for session feedback queries
    await queryInterface.addIndex('feedbacks', ['trainingPlanVersionId', 'sessionId'], {
      name: 'feedbacks_version_session_idx',
    });

    // Add unique constraint: one feedback per user per version (for version-level)
    // and one per user per session (for session-level)
    await queryInterface.addIndex('feedbacks', ['trainingPlanVersionId', 'userId', 'sessionId', 'targetType'], {
      name: 'feedbacks_user_target_unique',
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('feedbacks', 'feedbacks_user_target_unique');
    await queryInterface.removeIndex('feedbacks', 'feedbacks_version_session_idx');
    await queryInterface.removeColumn('feedbacks', 'targetType');
    await queryInterface.removeColumn('feedbacks', 'sessionId');
  }
};
