'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.sequelize.query(
      "CREATE TYPE enum_users_role AS ENUM ('admin','coach','player');"
    );
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_users_status AS ENUM ('pending','active','blocked');"
    );

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      passwordHash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: 'enum_users_role',
        allowNull: false,
        defaultValue: 'coach',
      },
      status: {
        type: 'enum_users_status',
        allowNull: false,
        defaultValue: 'pending',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('users', ['email'], { name: 'users_email_unique', unique: true });
    await queryInterface.addIndex('users', ['role'], { name: 'users_role_idx' });
    await queryInterface.addIndex('users', ['status'], { name: 'users_status_idx' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'users_status_idx');
    await queryInterface.removeIndex('users', 'users_role_idx');
    await queryInterface.removeIndex('users', 'users_email_unique');
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_users_status;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_users_role;');
  },
};
