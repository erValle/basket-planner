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
    await queryInterface.changeColumn('users', 'role', {
      type: 'enum_users_role',
      allowNull: false,
      defaultValue: 'user',
    });
  },
};
