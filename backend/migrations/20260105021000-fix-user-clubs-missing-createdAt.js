'use strict';

/**
 * Some dev DBs were created with a drifted `user_clubs` schema missing `createdAt`.
 * Sequelize migrations report the original create-table migration as applied, so
 * we add a corrective migration that is safe to run even if the column already exists.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'user_clubs';

    // Defensive: describe current table to avoid failing when column already exists.
    const columns = await queryInterface.describeTable(table);

    if (!columns.createdAt) {
      await queryInterface.addColumn(table, 'createdAt', {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    }

    // Ensure updatedAt is present and non-nullable too.
    // (We saw some DBs with updatedAt but we keep this migration robust.)
    if (!columns.updatedAt) {
      await queryInterface.addColumn(table, 'updatedAt', {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    }
  },

  async down(queryInterface) {
    const table = 'user_clubs';
    const columns = await queryInterface.describeTable(table);

    // Only drop what we added.
    if (columns.createdAt) {
      await queryInterface.removeColumn(table, 'createdAt');
    }

    if (columns.updatedAt) {
      await queryInterface.removeColumn(table, 'updatedAt');
    }
  },
};
