'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Make role nullable and remove the default.
    // This supports the flow where an admin creates a user without role and later enrolls them as player.
    await queryInterface.changeColumn('users', 'role', {
      type: 'enum_users_role',
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    // Restore previous behavior: role required with default 'user'.
    // If any rows were created with role NULL (valid in the 'up' state), backfill
    // them before making the column NOT NULL.
    await queryInterface.sequelize.query("UPDATE users SET role = 'user' WHERE role IS NULL;");
    await queryInterface.changeColumn('users', 'role', {
      type: 'enum_users_role',
      allowNull: false,
      defaultValue: 'user',
    });
  },
};
